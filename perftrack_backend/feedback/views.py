from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Avg

from .models import PeerFeedback
from .serializers import PeerFeedbackSerializer
from accounts.permissions import IsAdmin


class PeerFeedbackListCreateView(generics.ListCreateAPIView):
    serializer_class = PeerFeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return PeerFeedback.objects.select_related(
                'reviewer', 'reviewee',
                'reviewer__department', 'reviewee__department'
            ).all()
        return PeerFeedback.objects.filter(
            reviewee=user
        ).select_related(
            'reviewer', 'reviewee',
            'reviewer__department', 'reviewee__department'
        ) | PeerFeedback.objects.filter(
            reviewer=user
        ).select_related(
            'reviewer', 'reviewee',
            'reviewer__department', 'reviewee__department'
        )

    def perform_create(self, serializer):
        feedback = serializer.save(reviewer=self.request.user)
        # Create notification for the reviewee
        try:
            from notifications.models import Notification
            Notification.objects.create(
                recipient=feedback.reviewee,
                type='feedback',
                title='New Peer Feedback',
                message='You received new feedback from a colleague.',
            )
        except Exception:
            pass  # Don't fail if notifications app has issues


class PeerFeedbackDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PeerFeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return PeerFeedback.objects.all()
        return PeerFeedback.objects.filter(reviewer=user)


class MyFeedbackSummaryView(generics.GenericAPIView):
    """Get a summary of feedback received by the current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        received = PeerFeedback.objects.filter(reviewee=request.user)
        avg_rating = received.aggregate(avg=Avg('rating'))['avg'] or 0
        return Response({
            'total_received': received.count(),
            'average_rating': round(avg_rating, 2),
            'total_given': PeerFeedback.objects.filter(reviewer=request.user).count(),
        })
