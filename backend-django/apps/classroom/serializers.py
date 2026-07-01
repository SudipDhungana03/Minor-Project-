from rest_framework import serializers
from .models import Classroom, Assignment

class ClassroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classroom
        fields = ['id', 'teacher', 'name', 'subject', 'invite_code', 'students']
        read_only_fields = ['invite_code', 'teacher', 'students']

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = '__all__'