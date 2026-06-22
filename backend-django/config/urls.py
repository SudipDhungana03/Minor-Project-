# config/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Admin dashboard route
    path('admin/', admin.site.join if hasattr(admin.site, 'join') else admin.site.urls),

    # Connect your clean authentication paths to the system API route
    path('api/', include('apps.authentication.urls')),
]