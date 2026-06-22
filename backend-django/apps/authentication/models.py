from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin/Examiner'),
    ]
    
    # Changed from max_index_length to max_length
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='student'
    )
    # New fields for Step 1: Verification
    verification_code = models.CharField(max_length=6, null=True, blank=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.role})"