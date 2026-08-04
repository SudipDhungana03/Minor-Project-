from rest_framework.response import Response
from rest_framework.decorators import api_view
from .detector_service import run_analysis, run_source_verification
from ..models import DetectionResult
from apps.classroom.models import Submission
from .ocr_engine import extract_text_from_file
from .plagiarism_vector import build_similarity_report
import os
import logging
import io
import requests
from threading import Thread

logger = logging.getLogger(__name__)


@api_view(['POST'])
def detect_submission(request):
    submission_id = request.data.get('submission_id')
    
    # 1. Get the submission
    try:
        submission = Submission.objects.get(id=submission_id)
    except Submission.DoesNotExist:
        return Response({"error": "Submission not found"}, status=404)
        
    text = submission.content or ''

    # If a file was uploaded, always try to extract its text and include it in analysis.
    if submission.file:
        extracted = extract_text_from_file(submission.file)
        if extracted:
            if text.strip():
                text = f"{text}\n\n{extracted}"
            else:
                text = extracted
            if extracted != submission.extracted_text:
                submission.extracted_text = extracted
                submission.save(update_fields=['extracted_text'])
        elif not text.strip():
            report = {
                "is_ai_generated": False,
                "chunks": [],
                "note": "extraction_unavailable",
                "message": "No text found in submission and document extraction is unavailable."
            }
            DetectionResult.objects.update_or_create(
                submission=submission,
                defaults={
                    'is_ai_flagged': False,
                    'report_data': report
                }
            )
            return Response({"message": "Extraction failed", "report": report}, status=200)

    # 2. Run AI detection only; source lookup runs separately.
    report = run_analysis(text)
    
    # 3. Save to database
    result, created = DetectionResult.objects.update_or_create(
        submission=submission,
        defaults={
            'is_ai_flagged': report.get('is_ai_generated', False),
            'report_data': report
        }
    )
    
    return Response({
        "message": "Analysis saved", 
        "report": report
    })

@api_view(['POST'])
def verify_submission_sources(request):
    submission_id = request.data.get('submission_id')

    try:
        submission = Submission.objects.get(id=submission_id)
    except Submission.DoesNotExist:
        return Response({"error": "Submission not found"}, status=404)

    report = None
    existing = DetectionResult.objects.filter(submission=submission).order_by('-created_at').first()
    if existing and existing.report_data:
        report = existing.report_data
    else:
        text = submission.content or ''
        if submission.file:
            extracted = extract_text_from_file(submission.file)
            if extracted:
                text = f"{text}\n\n{extracted}" if text.strip() else extracted
        report = run_analysis(text)

    def _verify_in_background(report_data):
        try:
            verified = run_source_verification(report_data)
            DetectionResult.objects.update_or_create(
                submission=submission,
                defaults={
                    'is_ai_flagged': verified.get('is_ai_generated', False),
                    'report_data': verified
                }
            )
        except Exception:
            logger.exception('Background source verification failed for submission %s', submission_id)

    Thread(target=_verify_in_background, args=(report,), daemon=True).start()

    return Response({
        "message": "Source verification started",
        "report": report
    })


@api_view(['POST'])
def run_batch_plagiarism_analysis(request):
    """
    Batch plagiarism comparison endpoint.
    
    Compares multiple submissions using three similarity metrics:
    - J (Jaccard): Set-based token overlap (0-1 scale)
    - T (TF-IDF): Term frequency-inverse document frequency cosine similarity (0-1 scale)
    - S (Semantic): Weighted token overlap normalized by term frequency (0-1 scale)
    
    Extracts text from PDF, DOCX, PPTX, and HTML files and caches in database for faster future analysis.
    """
    submission_ids = request.data.get('submission_ids') or []
    if not submission_ids:
        return Response({'error': 'At least one submission id is required.'}, status=400)

    submissions = []
    for submission_id in submission_ids:
        try:
            submission = Submission.objects.get(id=submission_id)
        except Submission.DoesNotExist:
            continue

        # Use cached extracted text if available, otherwise extract and cache
        text = submission.content or ''
        if submission.file:
            if submission.extracted_text:
                extracted = submission.extracted_text
            else:
                extracted = extract_text_from_file(submission.file)
                if extracted:
                    submission.extracted_text = extracted
                    submission.save(update_fields=['extracted_text'])
            
            if extracted:
                text = f"{text}\n\n{extracted}" if text.strip() else extracted

        submissions.append({
            'id': submission.id,
            'title': submission.assignment.title if submission.assignment_id else 'Submission',
            'student_name': submission.student.username if getattr(submission.student, 'username', None) else '',
            'file_name': os.path.basename(submission.file.name) if submission.file else '',
            'file_url': submission.file.url if submission.file else '',
            'text': text,
        })

    if not submissions:
        return Response({'error': 'No valid submissions were found.'}, status=404)

    report = build_similarity_report(submissions)
    # Include extracted text in submitted_files for frontend display
    for idx, file_data in enumerate(report.get('submitted_files', [])):
        if idx < len(submissions):
            file_data['extracted_text'] = submissions[idx].get('text', '')
    return Response(report)
