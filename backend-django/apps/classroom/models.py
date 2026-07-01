from django.db import models
from django.conf import settings
import uuid

class Classroom(models.Model):
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='teaching_classes')
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    # This acts as the unique invitation token
    invite_code = models.CharField(max_length=10, unique=True, default=uuid.uuid4().hex[:6].upper())
    students = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='enrolled_classes', blank=True)

    def __str__(self):
        return f"{self.name} - {self.invite_code}"

class Assignment(models.Model):
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=255)
    description = models.TextField()
    due_date = models.DateTimeField()
    file = models.FileField(upload_to='assignments/', null=True, blank=True)

    def __str__(self):
        return self.title

class Submission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField(blank=True, null=True) # For the note/comment
    file = models.FileField(upload_to='submissions/', blank=True, null=True) # For file upload
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Submission by {self.student.username} for {self.assignment.title}"