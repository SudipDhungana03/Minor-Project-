from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Classroom
from .serializers import ClassroomSerializer
from .models import Assignment
from .serializers import AssignmentSerializer

class ClassroomViewSet(viewsets.ModelViewSet):
    queryset = Classroom.objects.all()
    serializer_class = ClassroomSerializer
    # Only allow logged-in users to interact with this API
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Automatically set the current user as the teacher
        serializer.save(teacher=self.request.user)

    @action(detail=False, methods=['post'])
    def join(self, request):
        code = request.data.get('invite_code')
        try:
            classroom = Classroom.objects.get(invite_code=code)
            classroom.students.add(request.user)
            return Response({"message": "Successfully joined!"})
        except Classroom.DoesNotExist:
            return Response({"error": "Invalid code"}, status=400)
        
    @action(detail=True, methods=['get'])
    def assignments(self, request, pk=None):
        classroom = self.get_object()
        assignments = Assignment.objects.filter(classroom=classroom)
        serializer = AssignmentSerializer(assignments, many=True)
        return Response(serializer.data)