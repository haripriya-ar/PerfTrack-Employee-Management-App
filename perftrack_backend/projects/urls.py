from django.urls import path
from .views import ProjectListCreateView, ProjectDetailView, ProjectProgressView

urlpatterns = [
    path('projects/', ProjectListCreateView.as_view(), name='project-list'),
    path('projects/<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:pk>/progress/', ProjectProgressView.as_view(), name='project-progress'),
]
