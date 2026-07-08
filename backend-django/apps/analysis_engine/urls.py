from django.urls import path
from django.urls import path
# detect_submission view lives under ml_adapters.views
from .ml_adapters.views import detect_submission


urlpatterns = [
    path('analyze/', detect_submission, name='detect-submission'),
]