from rest_framework.response import Response
from rest_framework.decorators import api_view
from .detector_service import run_analysis
from ..models import DetectionResult
from apps.classroom.models import Submission
import os
import logging

logger = logging.getLogger(__name__)


def _extract_text_from_file(file_field):
    """Try to extract text from common document types. Returns string or None on failure."""
    if not file_field:
        return None
    path = file_field.path
    if not os.path.exists(path):
        return None

    ext = os.path.splitext(path)[1].lower()
    try:
        if ext == '.pdf':
            try:
                from pypdf import PdfReader
                reader = PdfReader(path)
                return "\n".join([p.extract_text() or "" for p in reader.pages])
            except Exception:
                # fall back to PyPDF2 if available
                try:
                    import PyPDF2
                    with open(path, 'rb') as f:
                        reader = PyPDF2.PdfReader(f)
                        return "\n".join([p.extract_text() or "" for p in reader.pages])
                except Exception:
                    logger.exception('PDF extraction failed for %s', path)
                    return None

        if ext == '.docx':
            try:
                import docx
                doc = docx.Document(path)
                return "\n".join([p.text for p in doc.paragraphs])
            except Exception:
                logger.exception('DOCX extraction failed for %s', path)
                return None

        if ext == '.pptx':
            try:
                from pptx import Presentation
                prs = Presentation(path)
                texts = []
                for slide in prs.slides:
                    for shape in slide.shapes:
                        if hasattr(shape, 'text'):
                            texts.append(shape.text)
                return "\n".join(texts)
            except Exception:
                logger.exception('PPTX extraction failed for %s', path)
                return None

    except Exception:
        logger.exception('Unexpected error extracting text from %s', path)
        return None

    return None

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
        extracted = _extract_text_from_file(submission.file)
        if extracted:
            if text.strip():
                text = f"{text}\n\n{extracted}"
            else:
                text = extracted
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

    # 2. Run analysis
    report = run_analysis(text)
    
    # 3. Save to database
    # We use update_or_create so we don't duplicate results if they click "Analyze" twice
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
