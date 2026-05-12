from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import LoginView, LogoutView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('accounts.urls')),
    path('api/', include('performance.urls')),
    path('api/', include('reports.urls')),
    path('api/', include('feedback.urls')),
    path('api/', include('okr.urls')),
    path('api/', include('notifications.urls')),
    path('api/', include('onboarding.urls')),
    path('api/', include('employees.urls')),
    path('api/', include('projects.urls')),
]