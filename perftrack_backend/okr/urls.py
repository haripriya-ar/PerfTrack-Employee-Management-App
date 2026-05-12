from django.urls import path
from .views import (
    ObjectiveListCreateView, ObjectiveDetailView, ObjectiveProgressView,
    KeyResultListCreateView, KeyResultDetailView,
)

urlpatterns = [
    path('okr/objectives/', ObjectiveListCreateView.as_view(), name='objective-list'),
    path('okr/objectives/<int:pk>/', ObjectiveDetailView.as_view(), name='objective-detail'),
    path('okr/objectives/<int:pk>/progress/', ObjectiveProgressView.as_view(), name='objective-progress'),
    path('okr/key-results/', KeyResultListCreateView.as_view(), name='keyresult-list'),
    path('okr/key-results/<int:pk>/', KeyResultDetailView.as_view(), name='keyresult-detail'),
]
