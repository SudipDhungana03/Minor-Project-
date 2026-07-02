from django.db import models
from django.conf import settings
import uuid


def generate_random_invite_code():
    return uuid.uuid4().hex[:8].upper()


class Classroom(models.Model):
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='teaching_classes')
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    # Unique invitation token generated per classroom
    invite_code = models.CharField(max_length=10, unique=True, default=generate_random_invite_code, editable=False)
    students = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='enrolled_classes', blank=True)

    def generate_invite_code(self):
        code = generate_random_invite_code()
        while Classroom.objects.filter(invite_code__iexact=code).exclude(pk=self.pk).exists():
            code = generate_random_invite_code()
        return code

    def save(self, *args, **kwargs):
        if not self.invite_code:
            self.invite_code = self.generate_invite_code()
        super().save(*args, **kwargs)

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

class JoinRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='join_requests')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='join_requests')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('classroom', 'student')
        ordering = ['-created_at']

    def __str__(self):
        return f"Join request from {self.student.username} for {self.classroom.name} ({self.status})"

class Submission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField(blank=True, null=True) # For the note/comment
    file = models.FileField(upload_to='submissions/', blank=True, null=True) # For file upload
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Submission by {self.student.username} for {self.assignment.title}"