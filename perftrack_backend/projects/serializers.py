from rest_framework import serializers
from .models import Project
from accounts.serializers import UserMinimalSerializer


class ProjectSerializer(serializers.ModelSerializer):
    manager_detail = UserMinimalSerializer(source='manager', read_only=True)
    assigned_employees_detail = UserMinimalSerializer(
        source='assigned_employees', many=True, read_only=True
    )
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status', 'priority',
            'start_date', 'end_date', 'progress',
            'assigned_employees', 'assigned_employees_detail',
            'manager', 'manager_detail',
            'employee_count', 'created_at',
        ]

    def get_employee_count(self, obj):
        return obj.assigned_employees.count()


class ProjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            'name', 'description', 'status', 'priority',
            'start_date', 'end_date', 'progress',
            'assigned_employees', 'manager',
        ]
