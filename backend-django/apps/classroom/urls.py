from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssignmentViewSet, ClassroomViewSet, SubmissionViewSet

router = DefaultRouter()
router.register(r'classrooms', ClassroomViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'submissions', SubmissionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]