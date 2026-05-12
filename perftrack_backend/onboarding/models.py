from django.db import models
from accounts.models import User


class OnboardingTemplate(models.Model):
    name = models.CharField(max_length=200)
    department = models.CharField(max_length=100)
    steps = models.JSONField(default=list)  # [{title, description, order, required}]
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'onboarding_templates'

    def __str__(self):
        return f'{self.name} ({self.department})'


class OnboardingRecord(models.Model):
    employee = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='onboarding'
    )
    template = models.ForeignKey(
        OnboardingTemplate, on_delete=models.SET_NULL, null=True
    )
    completed_steps = models.JSONField(default=list)
    progress_percentage = models.FloatField(default=0.0)
    is_complete = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'onboarding_records'

    def __str__(self):
        return f'{self.employee.full_name} — {self.progress_percentage:.0f}%'
