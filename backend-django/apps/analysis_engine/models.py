from django.db import models
from apps.classroom.models import Submission  # Make sure this import matches your project structure

class DetectionResult(models.Model):
    # Links the result to a specific student submission
    submission = models.OneToOneField(Submission, on_delete=models.CASCADE, related_name='detection_result')
    
    # Stores the AI-flagged status
    is_ai_flagged = models.BooleanField(default=False)
    
    # Stores the detailed JSON report from your detector service
    report_data = models.JSONField() 
    
    # Timestamp for auditing
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Result for Submission {self.submission.id}"