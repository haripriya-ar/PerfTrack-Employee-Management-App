from django.urls import path
from .views import MeView, UserListCreateView, UserDetailView, TeamView, DepartmentListView

urlpatterns = [
    path('auth/me/', MeView.as_view(), name='me'),
    path('users/', UserListCreateView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('team/', TeamView.as_view(), name='team'),
    path('departments/', DepartmentListView.as_view(), name='department-list'),
]