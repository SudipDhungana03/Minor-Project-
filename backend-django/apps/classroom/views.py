from urllib import request
from django.utils import timezone

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Classroom, Assignment, Submission, JoinRequest
from .serializers import ClassroomSerializer, AssignmentSerializer, SubmissionSerializer, JoinRequestSerializer

class ClassroomViewSet(viewsets.ModelViewSet):
    queryset = Classroom.objects.all()
    serializer_class = ClassroomSerializer
    # Only allow logged-in users to interact with this API
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'teacher':
            return Classroom.objects.filter(teacher=user)
        return Classroom.objects.filter(students=user)

    def perform_create(self, serializer):
        # Automatically set the current user as the teacher
        serializer.save(teacher=self.request.user)

    @action(detail=False, methods=['post'])
    def join(self, request):
        code = (request.data.get('invite_code') or '').strip()
        if not code:
            return Response({"error": "Invite code is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            classroom = Classroom.objects.get(invite_code__iexact=code)
        except Classroom.DoesNotExist:
            return Response({"error": "Invalid invite code."}, status=status.HTTP_400_BAD_REQUEST)

        if classroom.teacher == request.user:
            return Response({"error": "Teacher cannot join their own classroom."}, status=status.HTTP_400_BAD_REQUEST)

        if classroom.students.filter(pk=request.user.pk).exists():
            return Response({"message": "You are already enrolled in this classroom."})

        join_request, created = JoinRequest.objects.get_or_create(
            classroom=classroom,
            student=request.user,
            defaults={'status': 'pending'}
        )

        if not created:
            if join_request.status == 'pending':
                return Response({"message": "Join request is already pending approval."})
            if join_request.status == 'accepted':
                return Response({"message": "You are already enrolled in this classroom."})
            join_request.status = 'pending'
            join_request.save()
            return Response({"message": "Join request resubmitted and pending approval."})

        return Response({"message": "Join request submitted. Waiting for teacher approval."})

    @action(detail=False, methods=['get'])
    def pending_requests(self, request):
        if request.user.role != 'teacher':
            return Response({"error": "Only teachers can view pending join requests."}, status=status.HTTP_403_FORBIDDEN)

        requests = JoinRequest.objects.filter(classroom__teacher=request.user, status='pending').select_related('student', 'classroom')
        serializer = JoinRequestSerializer(requests, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def process_join_request(self, request, pk=None):
        classroom = self.get_object()
        if classroom.teacher != request.user:
            return Response({"error": "Only the classroom teacher can process join requests."}, status=status.HTTP_403_FORBIDDEN)

        student_id = request.data.get('student_id')
        action_value = request.data.get('action')
        if action_value not in ['accept', 'reject']:
            return Response({"error": "Action must be accept or reject."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            join_request = JoinRequest.objects.get(classroom=classroom, student_id=student_id, status='pending')
        except JoinRequest.DoesNotExist:
            return Response({"error": "No pending join request found for this student."}, status=status.HTTP_404_NOT_FOUND)

        if action_value == 'accept':
            classroom.students.add(join_request.student)
            join_request.status = 'accepted'
            join_request.save()
            return Response({"message": "Student approved and added to the classroom."})

        join_request.status = 'rejected'
        join_request.save()
        return Response({"message": "Student join request rejected."})

    @action(detail=True, methods=['get'])
    def assignments(self, request, pk=None):
        classroom = self.get_object()
        assignments = Assignment.objects.filter(classroom=classroom)
        serializer = AssignmentSerializer(assignments, many=True, context={'request': request})
        return Response(serializer.data)

class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer 
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'teacher':
            return Submission.objects.filter(assignment__classroom__teacher=user)
        return Submission.objects.filter(student=user)

    def create(self, request, *args, **kwargs):
        assignment_id = request.data.get('assignment')
        if not assignment_id:
            return Response({'error': 'Assignment ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            assignment = Assignment.objects.get(pk=assignment_id)
        except Assignment.DoesNotExist:
            return Response({'error': 'Assignment not found.'}, status=status.HTTP_404_NOT_FOUND)

        if timezone.now() > assignment.due_date:
            return Response({'error': 'The submission deadline has passed.'}, status=status.HTTP_400_BAD_REQUEST)

        existing_submission = Submission.objects.filter(student=request.user, assignment=assignment).first()
        if existing_submission:
            serializer = self.get_serializer(existing_submission, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)

        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        submission = self.get_object()
        if timezone.now() > submission.assignment.due_date:
            return Response({'error': 'The submission deadline has passed.'}, status=status.HTTP_400_BAD_REQUEST)
        return super().update(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'teacher':
            return Assignment.objects.filter(classroom__teacher=user)
        return Assignment.objects.filter(classroom__students=user)

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'])
    def for_assignment(self, request):
        assignment_id = request.query_params.get('assignment_id')
        submissions = Submission.objects.filter(assignment_id=assignment_id).order_by('-submitted_at')
        serializer = SubmissionSerializer(submissions, many=True, context={'request': request})
        return Response(serializer.data)

