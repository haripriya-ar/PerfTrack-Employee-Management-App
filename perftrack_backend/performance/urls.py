from django.urls import path
from .views import (
    EvaluationPeriodListView,
    PerformanceRecordListView, PerformanceRecordCreateView, PerformanceRecordDetailView,
    PredictView, TrainModelView, EmployeeStatsView, DashboardSummaryView,
    GoalListCreateView, GoalDetailView, AttritionRiskView, EvaluationApprovalView,
)

urlpatterns = [
    path('periods/', EvaluationPeriodListView.as_view(), name='period-list'),
    path('performance/', PerformanceRecordListView.as_view(), name='performance-list'),
    path('performance/create/', PerformanceRecordCreateView.as_view(), name='performance-create'),
    path('performance/<int:pk>/', PerformanceRecordDetailView.as_view(), name='performance-detail'),
    path('performance/<int:pk>/approve/', EvaluationApprovalView.as_view(), name='performance-approve'),
    path('performance/predict/', PredictView.as_view(), name='predict'),
    path('performance/train/', TrainModelView.as_view(), name='train'),
    path('employees/<int:employee_id>/stats/', EmployeeStatsView.as_view(), name='employee-stats'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('goals/', GoalListCreateView.as_view(), name='goal-list'),
    path('goals/<int:pk>/', GoalDetailView.as_view(), name='goal-detail'),
    path('analytics/attrition-risk/', AttritionRiskView.as_view(), name='attrition-risk'),
]