from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Project
from .serializers import ProjectSerializer, ProjectCreateSerializer
from accounts.permissions import IsAdmin, IsAdminOrManager


class ProjectListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProjectCreateSerializer
        return ProjectSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrManager()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Project.objects.select_related('manager', 'manager__department').prefetch_related('assigned_employees')
        if user.role == 'admin':
            return qs.all()
        if user.role == 'manager':
            return qs.filter(manager=user)
        return qs.filter(assigned_employees=user)


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminOrManager]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProjectCreateSerializer
        return ProjectSerializer

    def get_queryset(self):
        return Project.objects.select_related('manager').prefetch_related('assigned_employees')


class ProjectProgressView(APIView):
    """Update project progress."""
    permission_classes = [IsAdminOrManager]

    def patch(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        progress = request.data.get('progress')
        if progress is not None:
            project.progress = min(max(int(progress), 0), 100)
            if project.progress >= 100:
                project.status = 'completed'
            project.save()
        return Response(ProjectSerializer(project).data)
