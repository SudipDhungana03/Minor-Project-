from rest_framework.response import Response
from rest_framework.decorators import api_view
from .ml_adapters.detector_service import run_analysis # Updated path
from ..models import DetectionResult 
from classroom.models import Submission 

@api_view(['POST'])
def detect_submission(request):
    submission_id = request.data.get('submission_id')
    
    # 1. Get the submission
    try:
        submission = Submission.objects.get(id=submission_id)
    except Submission.DoesNotExist:
        return Response({"error": "Submission not found"}, status=404)
        
    text = submission.content 
    
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
