from django.urls import path
from .ml_adapters.views import detect_submission, verify_submission_sources, run_batch_plagiarism_analysis


urlpatterns = [
    path('analyze/', detect_submission, name='detect-submission'),
    path('verify-sources/', verify_submission_sources, name='verify-submission-sources'),
    path('plagiarism/batch/', run_batch_plagiarism_analysis, name='batch-plagiarism-analysis'),
]
