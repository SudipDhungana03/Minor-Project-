from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, 
    SendVerificationView, 
    VerifyCodeView, 
    UpdateProfileView,  # Import the new profile view
    dashboard_view
)
from . import views

urlpatterns = [
    # Registration & Verification
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('send-code/', SendVerificationView.as_view(), name='send-code'),
    path('verify-code/', VerifyCodeView.as_view(), name='verify-code'),
    
    # Profile Completion
    path('user/profile/', UpdateProfileView.as_view(), name='update-profile'),

    # Auth & Tokens
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Dashboard
    path('dashboard-data/', views.dashboard_view, name='dashboard'),
]