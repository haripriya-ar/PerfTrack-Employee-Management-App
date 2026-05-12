from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Objective, KeyResult
from .serializers import (
    ObjectiveSerializer, ObjectiveCreateSerializer, KeyResultSerializer
)
from accounts.permissions import IsAdmin, IsAdminOrManager
from accounts.models import User


class ObjectiveListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ObjectiveCreateSerializer
        return ObjectiveSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Objective.objects.select_related('owner', 'owner__department').prefetch_related('key_results')
        if user.role == 'admin':
            return qs.all()
        if user.role == 'manager':
            team_ids = User.objects.filter(
                manager=user
            ).values_list('id', flat=True)
            return qs.filter(owner_id__in=list(team_ids) + [user.id])
        return qs.filter(owner=user)

    def perform_create(self, serializer):
        obj = serializer.save()
        # Notify the owner if they're different from the creator
        try:
            from notifications.models import Notification
            if obj.owner != self.request.user:
                Notification.objects.create(
                    recipient=obj.owner,
                    type='okr',
                    title='New OKR Assigned',
                    message=f'You have been assigned a new objective: "{obj.title}".',
                )
        except Exception:
            pass


class ObjectiveDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ObjectiveCreateSerializer
        return ObjectiveSerializer

    def get_queryset(self):
        return Objective.objects.select_related('owner').prefetch_related('key_results')


class ObjectiveProgressView(APIView):
    """Get detailed progress summary for an objective."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            obj = Objective.objects.prefetch_related('key_results').get(pk=pk)
        except Objective.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        krs = obj.key_results.all()
        return Response({
            'objective': obj.title,
            'overall_progress': obj.progress,
            'is_active': obj.is_active,
            'key_results': [
                {
                    'id': kr.id,
                    'title': kr.title,
                    'progress': kr.progress_percentage,
                    'current': kr.current_value,
                    'target': kr.target_value,
                    'unit': kr.unit,
                }
                for kr in krs
            ],
        })


class KeyResultListCreateView(generics.ListCreateAPIView):
    serializer_class = KeyResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        objective_id = self.request.query_params.get('objective')
        qs = KeyResult.objects.select_related('objective')
        if objective_id:
            qs = qs.filter(objective_id=objective_id)
        return qs


class KeyResultDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = KeyResultSerializer
    permission_classes = [IsAuthenticated]
    queryset = KeyResult.objects.select_related('objective')
