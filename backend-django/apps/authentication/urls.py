from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView
from . import views

urlpatterns = [
    # Plain registration endpoint
    path('register/', RegisterView.as_view(), name='auth_register'),
    
    # Plain login endpoint (returns JWT tokens for username + password)
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('dashboard-data/', views.dashboard_view, name='dashboard'),
    
]