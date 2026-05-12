from rest_framework import serializers
from .models import OnboardingTemplate, OnboardingRecord
from accounts.serializers import UserMinimalSerializer


class OnboardingTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingTemplate
        fields = ['id', 'name', 'department', 'steps', 'created_at']


class OnboardingRecordSerializer(serializers.ModelSerializer):
    employee_detail = UserMinimalSerializer(source='employee', read_only=True)
    template_detail = OnboardingTemplateSerializer(source='template', read_only=True)

    class Meta:
        model = OnboardingRecord
        fields = [
            'id', 'employee', 'employee_detail',
            'template', 'template_detail',
            'completed_steps', 'progress_percentage',
            'is_complete', 'started_at', 'completed_at',
        ]
        read_only_fields = [
            'progress_percentage', 'is_complete',
            'started_at', 'completed_at',
        ]
