from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User  # This imports your custom User model

# Register your model using Django's specialized User management interface
admin.site.register(User, UserAdmin)