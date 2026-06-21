from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer

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
            {"message": "Registration successful!"}, 
            status=status.HTTP_201_CREATED
        )

# --- Dashboard View (The Secure Endpoint) ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_view(request):
    """
    This endpoint is protected. Only users with a valid JWT token
    can access this, thanks to the @permission_classes([IsAuthenticated]) decorator.
    """
    return Response({
        "message": "Access Granted: This is your secure data.",
        "username": request.user.username,
        "email": request.user.email
    }, status=status.HTTP_200_OK)