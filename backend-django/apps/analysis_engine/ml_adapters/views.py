from rest_framework.response import Response
from rest_framework.decorators import api_view
from .detector_service import run_analysis
from ..models import DetectionResult  # Importing your new model
from classroom.models import Submission # Assuming this is where submissions live

@api_view(['POST'])
def detect_submission(request):
    submission_id = request.data.get('submission_id')
    
    # 1. Get the actual submission text
    submission = Submission.objects.get(id=submission_id)
    text = submission.content 
    
    # 2. Run your analysis
    report = run_analysis(text)
    
    # 3. SAVE to the database
    result = DetectionResult.objects.create(
        submission=submission,
        is_ai_flagged=report.get('is_ai_generated', False),
        report_data=report
    )
    
    return Response({"message": "Analysis saved", "report": report})
