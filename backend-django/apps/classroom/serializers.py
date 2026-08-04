import os
from rest_framework import serializers
from .models import Classroom, Assignment, Submission, JoinRequest
from apps.analysis_engine.models import DetectionResult
from apps.analysis_engine.ml_adapters.ocr_engine import extract_text_from_file

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
    analysis_report = serializers.SerializerMethodField()
    extracted_text = serializers.SerializerMethodField()
    file_exists = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'student', 'student_username', 'content', 'file', 'file_url', 'file_exists', 'submitted_at', 'analysis_report', 'extracted_text']
        read_only_fields = ['student', 'student_username', 'submitted_at', 'analysis_report', 'extracted_text', 'file_exists', 'file_url']

    def get_analysis_report(self, obj):
        try:
            result = DetectionResult.objects.filter(submission=obj).order_by('-created_at').first()
            return result.report_data if result else None
        except Exception:
            return None

    def get_extracted_text(self, obj):
        if obj.content and obj.content.strip():
            return obj.content
        if obj.extracted_text:
            return obj.extracted_text
        if obj.file:
            return extract_text_from_file(obj.file)
        return None

    def get_file_exists(self, obj):
        if not obj.file or not obj.file.name:
            return False
        try:
            path = obj.file.path
            return bool(path and os.path.exists(path))
        except Exception:
            return False

    def get_file_url(self, obj):
        if obj.file and obj.file.name:
            try:
                request = self.context.get('request') if hasattr(self, 'context') else None
                if request is not None:
                    try:
                        return request.build_absolute_uri(obj.file.url)
                    except Exception:
                        return obj.file.url
                return obj.file.url
            except Exception:
                return None
        return None

class JoinRequestSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    classroom_subject = serializers.CharField(source='classroom.subject', read_only=True)

    class Meta:
        model = JoinRequest
        fields = ['id', 'classroom', 'classroom_name', 'classroom_subject', 'student', 'student_username', 'status', 'created_at']
        read_only_fields = ['id', 'classroom', 'classroom_name', 'classroom_subject', 'student', 'student_username', 'status', 'created_at']