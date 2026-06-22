import random
from django.core.mail import send_mail
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer
from rest_framework.generics import UpdateAPIView
from rest_framework.permissions import IsAuthenticated
from .serializers import ProfileSerializer

User = get_user_model()

# --- Registration View ---
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"message": "Registration successful! Please verify your email."}, 
            status=status.HTTP_201_CREATED
        )

# --- NEW: Send Verification Code ---
class SendVerificationView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            code = str(random.randint(100000, 999999))
            user.verification_code = code
            user.save()
            send_mail('Verification Code', f'Your code is {code}', 'noreply@project.com', [email])
            return Response({"message": "Code sent"})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

# --- NEW: Verify Code ---
class VerifyCodeView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        user = User.objects.get(email=email)
        if user.verification_code == code:
            user.is_verified = True
            user.save()
            return Response({"message": "Verification successful!"})
        return Response({"error": "Invalid code"}, status=status.HTTP_400_BAD_REQUEST)

# --- Dashboard View ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_view(request):
    return Response({
        "message": "Access Granted",
        "username": request.user.username,
        "role": request.user.role
    }, status=status.HTTP_200_OK)

class UpdateProfileView(UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        # This ensures the user can only update their own profile
        return self.request.user