from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClassroomViewSet
from .views import ClassroomViewSet, SubmissionViewSet

router = DefaultRouter()
router.register(r'classrooms', ClassroomViewSet)
router.register(r'submissions', SubmissionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]