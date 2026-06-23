from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Grabs your custom User model dynamically
User = get_user_model()

# --- Registration Serializer ---
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        # Automatically hashes and encrypts the password into PostgreSQL
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

# --- Profile Update Serializer ---
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # These fields will be updated during the CompleteProfile step
        fields = ['role', 'name', 'organization']
        
        # Optional: set these to not required so they can be updated one by one
        extra_kwargs = {
            'role': {'required': False},
            'name': {'required': False},
            'organization': {'required': False}
        }

# --- Custom Token Serializer for Role-Based Login ---
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add 'role' to the JWT token claims
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Include 'role' in the response body so the frontend can read it
        data['role'] = self.user.role
        return data