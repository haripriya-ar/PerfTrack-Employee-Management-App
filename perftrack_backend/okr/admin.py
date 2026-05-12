from django.contrib import admin
from .models import Objective, KeyResult

class KeyResultInline(admin.TabularInline):
    model = KeyResult
    extra = 1

@admin.register(Objective)
class ObjectiveAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'department', 'progress', 'is_active', 'start_date', 'end_date']
    list_filter = ['is_active', 'department']
    search_fields = ['title', 'owner__first_name']
    inlines = [KeyResultInline]

@admin.register(KeyResult)
class KeyResultAdmin(admin.ModelAdmin):
    list_display = ['title', 'objective', 'current_value', 'target_value', 'progress_percentage']
