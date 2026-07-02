from rest_framework import serializers
from .models import Classroom, Assignment, Submission, JoinRequest

class ClassroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classroom
        fields = ['id', 'teacher', 'name', 'subject', 'invite_code', 'students']
        read_only_fields = ['invite_code', 'teacher', 'students']

class AssignmentSerializer(serializers.ModelSerializer):
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    classroom_subject = serializers.CharField(source='classroom.subject', read_only=True)

    class Meta:
        model = Assignment
        fields = ['id', 'classroom', 'classroom_name', 'classroom_subject', 'title', 'description', 'due_date', 'file']

class SubmissionSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'student', 'student_username', 'content', 'file', 'submitted_at']
        read_only_fields = ['student', 'student_username', 'submitted_at']

class JoinRequestSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    classroom_subject = serializers.CharField(source='classroom.subject', read_only=True)

    class Meta:
        model = JoinRequest
        fields = ['id', 'classroom', 'classroom_name', 'classroom_subject', 'student', 'student_username', 'status', 'created_at']
        read_only_fields = ['id', 'classroom', 'classroom_name', 'classroom_subject', 'student', 'student_username', 'status', 'created_at']