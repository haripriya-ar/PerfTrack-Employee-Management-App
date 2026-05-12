from django.urls import path
from .views import (
    CompanyReportView, EmployeeReportView, TeamReportView,
    PerformancePDFReportView, EmployeeCSVExportView,
    EmployeeListView,
)

urlpatterns = [
    path('reports/company/', CompanyReportView.as_view(), name='company-report'),
    path('reports/employee/<int:employee_id>/', EmployeeReportView.as_view(), name='employee-report'),
    path('reports/team/', TeamReportView.as_view(), name='team-report'),
    path('reports/performance-pdf/', PerformancePDFReportView.as_view(), name='performance-pdf'),
    path('reports/employees-csv/', EmployeeCSVExportView.as_view(), name='employees-csv'),
    path('employees-dropdown/', EmployeeListView.as_view(), name='employee-dropdown'),
]