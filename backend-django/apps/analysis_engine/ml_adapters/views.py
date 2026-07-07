from rest_framework.decorators import api_view
from rest_framework.response import Response
from .detector_service import run_analysis

@api_view(['POST'])
def detect_submission(request):
    text = request.data.get('text', '')
    if not text:
        return Response({"error": "No text provided"}, status=400)
    
    report = run_analysis(text)
    return Response({"report": report})