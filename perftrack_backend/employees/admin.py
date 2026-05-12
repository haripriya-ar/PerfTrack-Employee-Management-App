from django.contrib import admin
from .models import Employee

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['user', 'employee_id', 'designation', 'status', 'promotion_eligible', 'date_of_joining']
    list_filter = ['status', 'promotion_eligible']
    search_fields = ['user__first_name', 'user__last_name', 'employee_id', 'designation']
