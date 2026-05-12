from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from .models import OnboardingTemplate, OnboardingRecord
from .serializers import OnboardingTemplateSerializer, OnboardingRecordSerializer
from accounts.permissions import IsAdmin


class OnboardingTemplateListCreateView(generics.ListCreateAPIView):
    serializer_class = OnboardingTemplateSerializer
    queryset = OnboardingTemplate.objects.all()

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAuthenticated()]


class OnboardingTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OnboardingTemplateSerializer
    permission_classes = [IsAdmin]
    queryset = OnboardingTemplate.objects.all()


class OnboardingRecordListView(generics.ListAPIView):
    serializer_class = OnboardingRecordSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return OnboardingRecord.objects.select_related(
            'employee', 'template', 'employee__department'
        ).all()


class OnboardingRecordCreateView(generics.CreateAPIView):
    serializer_class = OnboardingRecordSerializer
    permission_classes = [IsAdmin]


class MyOnboardingView(APIView):
    """Get the current user's onboarding record."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            record = OnboardingRecord.objects.select_related(
                'template'
            ).get(employee=request.user)
            return Response(OnboardingRecordSerializer(record).data)
        except OnboardingRecord.DoesNotExist:
            return Response(
                {'message': 'No onboarding record found.'},
                status=status.HTTP_404_NOT_FOUND,
            )


class CompleteStepView(APIView):
    """Mark a step as complete in the user's onboarding."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            record = OnboardingRecord.objects.select_related('template').get(pk=pk)
        except OnboardingRecord.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        step_id = request.data.get('step_id')
        if step_id is None:
            return Response({'error': 'step_id required'}, status=400)

        if step_id not in record.completed_steps:
            record.completed_steps.append(step_id)

        total_steps = len(record.template.steps) if record.template else 1
        record.progress_percentage = (len(record.completed_steps) / total_steps) * 100

        if record.progress_percentage >= 100:
            record.is_complete = True
            record.completed_at = timezone.now()

        record.save()
        return Response({
            'progress': record.progress_percentage,
            'is_complete': record.is_complete,
            'completed_steps': record.completed_steps,
        })
