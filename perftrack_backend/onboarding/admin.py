from django.contrib import admin
from .models import OnboardingTemplate, OnboardingRecord

@admin.register(OnboardingTemplate)
class OnboardingTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'department', 'created_at']
    list_filter = ['department']

@admin.register(OnboardingRecord)
class OnboardingRecordAdmin(admin.ModelAdmin):
    list_display = ['employee', 'template', 'progress_percentage', 'is_complete', 'started_at']
    list_filter = ['is_complete']
