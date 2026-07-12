from django.urls import path
from .ml_adapters.views import detect_submission, verify_submission_sources


urlpatterns = [
    path('analyze/', detect_submission, name='detect-submission'),
    path('verify-sources/', verify_submission_sources, name='verify-submission-sources'),
]
