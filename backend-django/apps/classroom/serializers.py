from rest_framework import serializers
from .models import Classroom, Assignment

class ClassroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classroom
        fields = ['id', 'name', 'subject', 'invite_code', 'teacher']
        read_only_fields = ['invite_code'] # Code is generated automatically