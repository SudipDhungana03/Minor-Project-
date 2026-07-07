from django.urls import path
from .views import detect_submission

urlpatterns = [
    path('analyze/', detect_submission, name='detect-submission'),
]