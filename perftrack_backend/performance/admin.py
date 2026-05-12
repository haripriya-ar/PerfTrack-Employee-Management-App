from django.contrib import admin
from .models import PerformanceRecord, EvaluationPeriod, Goal

@admin.register(EvaluationPeriod)
class EvaluationPeriodAdmin(admin.ModelAdmin):
    list_display = ['name', 'start_date', 'end_date', 'is_active']

@admin.register(PerformanceRecord)
class PerformanceRecordAdmin(admin.ModelAdmin):
    list_display = ['employee', 'period', 'task_completion', 'productivity', 'attendance', 'rating', 'predicted_score']
    list_filter = ['period', 'employee__department']
    search_fields = ['employee__first_name', 'employee__last_name']

@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ['employee', 'title', 'status', 'due_date']