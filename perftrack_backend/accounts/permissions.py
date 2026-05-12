from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'manager')


class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'manager')


class IsOwnerOrAdminOrManager(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role in ('admin', 'manager'):
            return True
        if hasattr(obj, 'employee'):
            return obj.employee == request.user
        return obj == request.user