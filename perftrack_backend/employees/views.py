from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Employee
from .serializers import EmployeeSerializer, EmployeeMinimalSerializer
from accounts.permissions import IsAdmin, IsAdminOrManager


class EmployeeListCreateView(generics.ListCreateAPIView):
    serializer_class = EmployeeSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAdminOrManager()]

    def get_queryset(self):
        user = self.request.user
        qs = Employee.objects.select_related(
            'user', 'user__department', 'user__manager'
        )
        if user.role == 'admin':
            return qs.all()
        if user.role == 'manager':
            return qs.filter(user__manager=user)
        return qs.filter(user=user)


class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAdminOrManager]
    queryset = Employee.objects.select_related(
        'user', 'user__department', 'user__manager'
    )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = 'terminated'
        instance.save()
        return Response(status=204)


class EmployeeDropdownView(generics.GenericAPIView):
    """Simplified employee list for dropdown selectors — any authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from accounts.models import User
        employees = User.objects.filter(
            role='employee', is_active=True,
        ).select_related('department')

        data = []
        for emp in employees:
            data.append({
                'id': emp.id,
                'full_name': emp.full_name,
                'department': emp.department.name if emp.department else '',
                'email': emp.email,
                'avatar_initials': emp.avatar_initials,
            })
        return Response(data)

