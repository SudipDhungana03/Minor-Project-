from rest_framework import serializers
from .models import Classroom, Assignment
from .models import Submission

class ClassroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classroom
        fields = ['id', 'teacher', 'name', 'subject', 'invite_code', 'students']
        read_only_fields = ['invite_code', 'teacher', 'students']

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = '__all__'

class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'student', 'content', 'file', 'submitted_at']
        read_only_fields = ['student', 'submitted_at']