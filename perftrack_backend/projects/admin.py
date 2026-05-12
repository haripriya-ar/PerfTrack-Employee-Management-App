from django.contrib import admin
from .models import Project

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'priority', 'progress', 'manager', 'start_date', 'end_date']
    list_filter = ['status', 'priority']
    search_fields = ['name', 'description']
    filter_horizontal = ['assigned_employees']
