from django.urls import path
from .views import PeerFeedbackListCreateView, PeerFeedbackDetailView, MyFeedbackSummaryView

urlpatterns = [
    path('feedback/', PeerFeedbackListCreateView.as_view(), name='feedback-list'),
    path('feedback/<int:pk>/', PeerFeedbackDetailView.as_view(), name='feedback-detail'),
    path('feedback/summary/', MyFeedbackSummaryView.as_view(), name='feedback-summary'),
]
