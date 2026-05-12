from rest_framework import serializers
from .models import Employee
from accounts.serializers import UserMinimalSerializer


class EmployeeSerializer(serializers.ModelSerializer):
    user_detail = UserMinimalSerializer(source='user', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'user', 'user_detail', 'full_name',
            'employee_id', 'designation',
            'date_of_joining', 'salary', 'status',
            'promotion_eligible', 'bonus_amount',
        ]


class EmployeeMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    department_name = serializers.CharField(
        source='user.department.name', read_only=True
    )

    class Meta:
        model = Employee
        fields = [
            'id', 'user', 'full_name', 'employee_id',
            'designation', 'status', 'department_name',
        ]
