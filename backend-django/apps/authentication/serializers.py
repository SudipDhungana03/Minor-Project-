from rest_framework import serializers
from django.contrib.auth import get_user_model

# Grabs your custom User model dynamically
User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']  # Clean, minimal onboarding fields

    def create(self, validated_data):
        # Automatically hashes and encrypts the password into PostgreSQL
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user