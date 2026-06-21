# config/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Admin dashboard route
    path('admin/', admin.site.join if hasattr(admin.site, 'join') else admin.site.urls),
]