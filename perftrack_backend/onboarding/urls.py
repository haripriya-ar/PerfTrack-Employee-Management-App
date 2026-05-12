from django.urls import path
from .views import (
    OnboardingTemplateListCreateView, OnboardingTemplateDetailView,
    OnboardingRecordListView, OnboardingRecordCreateView,
    MyOnboardingView, CompleteStepView,
)

urlpatterns = [
    path('onboarding/templates/', OnboardingTemplateListCreateView.as_view(), name='onboarding-template-list'),
    path('onboarding/templates/<int:pk>/', OnboardingTemplateDetailView.as_view(), name='onboarding-template-detail'),
    path('onboarding/', OnboardingRecordListView.as_view(), name='onboarding-list'),
    path('onboarding/create/', OnboardingRecordCreateView.as_view(), name='onboarding-create'),
    path('onboarding/me/', MyOnboardingView.as_view(), name='onboarding-me'),
    path('onboarding/<int:pk>/complete-step/', CompleteStepView.as_view(), name='onboarding-complete-step'),
]
