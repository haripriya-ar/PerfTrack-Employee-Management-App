from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import logging

from .models import Project
from .serializers import ProjectSerializer, ProjectCreateSerializer
from accounts.permissions import IsAdmin, IsAdminOrManager

logger = logging.getLogger(__name__)


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

    def perform_create(self, serializer):
        project = serializer.save()
        # Create notifications for all assigned employees
        try:
            from notifications.models import Notification
            for emp in project.assigned_employees.all():
                if emp != self.request.user:
                    Notification.objects.create(
                        recipient=emp,
                        type='project',
                        title='New Project Assignment',
                        message=f'You have been assigned to project: "{project.name}".',
                    )
        except Exception as e:
            logger.warning(f'Failed to create project notification: {e}')


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProjectCreateSerializer
        return ProjectSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Project.objects.select_related('manager').prefetch_related('assigned_employees')
        if user.role in ('admin', 'manager'):
            return qs
        # Employees can only see projects they're assigned to
        return qs.filter(assigned_employees=user)

    def perform_update(self, serializer):
        old_project = self.get_object()
        old_employees = set(old_project.assigned_employees.values_list('id', flat=True))
        project = serializer.save()
        # Notify newly assigned employees
        try:
            from notifications.models import Notification
            new_employees = set(project.assigned_employees.values_list('id', flat=True))
            added = new_employees - old_employees
            if added:
                from accounts.models import User
                for emp in User.objects.filter(id__in=added):
                    Notification.objects.create(
                        recipient=emp,
                        type='project',
                        title='New Project Assignment',
                        message=f'You have been assigned to project: "{project.name}".',
                    )
        except Exception as e:
            logger.warning(f'Failed to create project update notification: {e}')


class ProjectProgressView(APIView):
    """Update project progress."""
    permission_classes = [IsAdminOrManager]

    def patch(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        old_status = project.status
        progress = request.data.get('progress')
        new_status = request.data.get('status')
        if progress is not None:
            project.progress = min(max(int(progress), 0), 100)
            if project.progress >= 100:
                project.status = 'completed'
        if new_status and new_status in dict(Project.STATUS_CHOICES):
            project.status = new_status
        project.save()

        # Notify on status change
        if project.status != old_status:
            try:
                from notifications.models import Notification
                for emp in project.assigned_employees.all():
                    Notification.objects.create(
                        recipient=emp,
                        type='project',
                        title='Project Status Updated',
                        message=f'Project "{project.name}" status changed to {project.get_status_display()}.',
                    )
            except Exception as e:
                logger.warning(f'Failed to create status notification: {e}')

        return Response(ProjectSerializer(project).data)

