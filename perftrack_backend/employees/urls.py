from django.urls import path
from .views import EmployeeListCreateView, EmployeeDetailView, EmployeeDropdownView

urlpatterns = [
    path('employees/', EmployeeListCreateView.as_view(), name='employee-list'),
    path('employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('employees/dropdown/', EmployeeDropdownView.as_view(), name='employee-dropdown'),
]
