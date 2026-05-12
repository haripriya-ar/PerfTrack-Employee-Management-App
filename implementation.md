# PerfTrack AI — Implementation Guide

> Full-stack workforce management system with AI-powered performance analytics.
> **Stack:** React (Vite) · Django REST Framework · PostgreSQL · JWT Auth

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Project Structure](#2-project-structure)
3. [Backend Setup (Django)](#3-backend-setup-django)
4. [Database Models](#4-database-models)
5. [JWT Authentication](#5-jwt-authentication)
6. [Role-Based Access Control](#6-role-based-access-control)
7. [REST API Endpoints](#7-rest-api-endpoints)
8. [AI Performance Engine](#8-ai-performance-engine)
9. [Frontend Setup (React + Vite)](#9-frontend-setup-react--vite)
10. [Frontend Architecture & Routes](#10-frontend-architecture--routes)
11. [Dashboard Modules](#11-dashboard-modules)
12. [OKR Management](#12-okr-management)
13. [Peer Feedback System](#13-peer-feedback-system)
14. [Predictive Analytics](#14-predictive-analytics)
15. [Real-Time Notifications](#15-real-time-notifications)
16. [Onboarding Management](#16-onboarding-management)
17. [Data Visualization](#17-data-visualization)
18. [Report Generation (PDF & CSV)](#18-report-generation-pdf--csv)
19. [Environment Configuration](#19-environment-configuration)
20. [Deployment](#20-deployment)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│   React (Vite)  ·  Tailwind CSS  ·  Recharts  ·  Axios         │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / REST / WebSocket
┌───────────────────────────▼─────────────────────────────────────┐
│                        API LAYER                                │
│   Django REST Framework  ·  JWT (SimpleJWT)  ·  Django Channels │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      SERVICE LAYER                              │
│   AI Engine  ·  OKR Service  ·  Notification Service           │
│   Report Generator  ·  Onboarding Workflow Engine               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                       DATA LAYER                                │
│   PostgreSQL  ·  Redis (cache + channels)  ·  Celery (tasks)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Project Structure

```
perftrack/
├── backend/
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── accounts/          # Users, roles, JWT
│   │   ├── employees/         # Employee profiles
│   │   ├── performance/       # Scoring, tracking
│   │   ├── projects/          # Project management
│   │   ├── okr/               # OKR management
│   │   ├── feedback/          # Peer reviews
│   │   ├── analytics/         # Predictive engine
│   │   ├── notifications/     # Real-time alerts
│   │   ├── onboarding/        # Onboarding workflows
│   │   └── reports/           # Export engine
│   ├── requirements.txt
│   └── manage.py
│
└── frontend/
    ├── src/
    │   ├── api/               # Axios clients
    │   ├── auth/              # JWT context, guards
    │   ├── components/        # Shared UI components
    │   ├── pages/
    │   │   ├── auth/
    │   │   ├── hr/
    │   │   ├── manager/
    │   │   └── employee/
    │   ├── hooks/             # Custom React hooks
    │   ├── store/             # Zustand state
    │   ├── utils/
    │   └── App.jsx
    ├── vite.config.js
    └── package.json
```

---

## 3. Backend Setup (Django)

### 3.1 Install Dependencies

```bash
pip install django djangorestframework djangorestframework-simplejwt \
    django-cors-headers channels channels-redis celery redis \
    psycopg2-binary reportlab pandas scikit-learn numpy \
    django-filter Pillow python-decouple
```

**`requirements.txt`**
```
Django==5.0
djangorestframework==3.15
djangorestframework-simplejwt==5.3
django-cors-headers==4.3
channels==4.0
channels-redis==4.2
celery==5.3
redis==5.0
psycopg2-binary==2.9
reportlab==4.1
pandas==2.2
scikit-learn==1.4
numpy==1.26
django-filter==23.5
Pillow==10.2
python-decouple==3.8
```

### 3.2 Base Settings

```python
# config/settings/base.py
from decouple import config

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', cast=bool, default=False)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'django_filters',
    # Project apps
    'apps.accounts',
    'apps.employees',
    'apps.performance',
    'apps.projects',
    'apps.okr',
    'apps.feedback',
    'apps.analytics',
    'apps.notifications',
    'apps.onboarding',
    'apps.reports',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

AUTH_USER_MODEL = 'accounts.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {'hosts': [config('REDIS_URL', default='redis://localhost:6379')]},
    }
}

CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://localhost:6379')

CORS_ALLOWED_ORIGINS = config('CORS_ORIGINS', cast=lambda v: v.split(','))
```

---

## 4. Database Models

### 4.1 User & Role Model

```python
# apps/accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('hr', 'HR/Admin'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    department = models.CharField(max_length=100, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'
```

### 4.2 Employee Profile

```python
# apps/employees/models.py
from django.db import models
from apps.accounts.models import User

class Employee(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('on_leave', 'On Leave'),
        ('terminated', 'Terminated'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee')
    manager = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)
    employee_id = models.CharField(max_length=20, unique=True)
    designation = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    date_of_joining = models.DateField()
    salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    promotion_eligible = models.BooleanField(default=False)
    bonus_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.employee_id})"

    class Meta:
        db_table = 'employees'
```

### 4.3 Performance Model

```python
# apps/performance/models.py
from django.db import models
from apps.employees.models import Employee

class PerformanceRecord(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='performance_records')
    period_start = models.DateField()
    period_end = models.DateField()
    task_completion_rate = models.FloatField(default=0.0)   # 0–100
    productivity_score = models.FloatField(default=0.0)
    attendance_score = models.FloatField(default=0.0)
    work_quality_score = models.FloatField(default=0.0)
    overall_rating = models.FloatField(default=0.0)
    ai_score = models.FloatField(null=True, blank=True)
    ai_insights = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'performance_records'
        ordering = ['-period_start']
```

### 4.4 Project Model

```python
# apps/projects/models.py
from django.db import models
from apps.employees.models import Employee

class Project(models.Model):
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    PRIORITY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    start_date = models.DateField()
    end_date = models.DateField()
    progress = models.IntegerField(default=0)           # 0–100
    assigned_employees = models.ManyToManyField(Employee, related_name='projects', blank=True)
    manager = models.ForeignKey(Employee, null=True, on_delete=models.SET_NULL, related_name='managed_projects')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'projects'
```

### 4.5 OKR Model

```python
# apps/okr/models.py
from django.db import models
from apps.employees.models import Employee

class Objective(models.Model):
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='objectives')
    department = models.CharField(max_length=100, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    progress = models.FloatField(default=0.0)
    is_active = models.BooleanField(default=True)

class KeyResult(models.Model):
    objective = models.ForeignKey(Objective, on_delete=models.CASCADE, related_name='key_results')
    title = models.CharField(max_length=300)
    target_value = models.FloatField()
    current_value = models.FloatField(default=0.0)
    unit = models.CharField(max_length=50, blank=True)
    progress_percentage = models.FloatField(default=0.0)

    def save(self, *args, **kwargs):
        if self.target_value > 0:
            self.progress_percentage = (self.current_value / self.target_value) * 100
        super().save(*args, **kwargs)
        # Recalculate parent objective progress
        krs = self.objective.key_results.all()
        if krs.exists():
            self.objective.progress = sum(kr.progress_percentage for kr in krs) / krs.count()
            self.objective.save()
```

### 4.6 Peer Feedback Model

```python
# apps/feedback/models.py
from django.db import models
from apps.employees.models import Employee

class PeerFeedback(models.Model):
    reviewer = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='given_feedback')
    reviewee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='received_feedback')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comments = models.TextField()
    strengths = models.TextField(blank=True)
    improvements = models.TextField(blank=True)
    is_anonymous = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'peer_feedback'
        unique_together = ('reviewer', 'reviewee')
```

### 4.7 Notification Model

```python
# apps/notifications/models.py
from django.db import models
from apps.accounts.models import User

class Notification(models.Model):
    TYPE_CHOICES = [
        ('performance', 'Performance'),
        ('project', 'Project'),
        ('feedback', 'Feedback'),
        ('hr', 'HR'),
        ('okr', 'OKR'),
        ('system', 'System'),
    ]
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
```

### 4.8 Onboarding Model

```python
# apps/onboarding/models.py
from django.db import models
from apps.employees.models import Employee

class OnboardingTemplate(models.Model):
    name = models.CharField(max_length=200)
    department = models.CharField(max_length=100)
    steps = models.JSONField(default=list)   # [{title, description, order, required}]

class OnboardingRecord(models.Model):
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='onboarding')
    template = models.ForeignKey(OnboardingTemplate, on_delete=models.SET_NULL, null=True)
    completed_steps = models.JSONField(default=list)
    progress_percentage = models.FloatField(default=0.0)
    is_complete = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
```

---

## 5. JWT Authentication

### 5.1 SimpleJWT Configuration

```python
# config/settings/base.py
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}
```

### 5.2 Custom Token with Role Claim

```python
# apps/accounts/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['full_name'] = user.get_full_name()
        token['department'] = user.department
        return token

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
```

### 5.3 Auth URLs

```python
# config/urls.py
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from apps.accounts.serializers import CustomTokenObtainPairView

urlpatterns = [
    path('api/auth/login/',   CustomTokenObtainPairView.as_view()),
    path('api/auth/refresh/', TokenRefreshView.as_view()),
    path('api/auth/logout/',  TokenBlacklistView.as_view()),
    path('api/', include('apps.accounts.urls')),
    path('api/', include('apps.employees.urls')),
    path('api/', include('apps.performance.urls')),
    path('api/', include('apps.projects.urls')),
    path('api/', include('apps.okr.urls')),
    path('api/', include('apps.feedback.urls')),
    path('api/', include('apps.analytics.urls')),
    path('api/', include('apps.notifications.urls')),
    path('api/', include('apps.onboarding.urls')),
    path('api/', include('apps.reports.urls')),
]
```

---

## 6. Role-Based Access Control

### 6.1 Custom Permission Classes

```python
# apps/accounts/permissions.py
from rest_framework.permissions import BasePermission

class IsHRAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'hr'

class IsManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('manager', 'hr')

class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

class IsSelfOrHR(BasePermission):
    """Employee can view own data; HR can view all."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'hr':
            return True
        return obj.user == request.user
```

### 6.2 Applying Permissions in Views

```python
# apps/employees/views.py
from rest_framework import viewsets
from apps.accounts.permissions import IsHRAdmin, IsManager, IsSelfOrHR

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related('user', 'manager').all()
    serializer_class = EmployeeSerializer

    def get_permissions(self):
        if self.action in ('create', 'destroy'):
            return [IsHRAdmin()]
        if self.action in ('list', 'update', 'partial_update'):
            return [IsManager()]
        return [IsSelfOrHR()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'hr':
            return Employee.objects.all()
        if user.role == 'manager':
            return Employee.objects.filter(manager__user=user)
        return Employee.objects.filter(user=user)
```

---

## 7. REST API Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login/` | Public | Obtain JWT tokens |
| POST | `/api/auth/refresh/` | Public | Refresh access token |
| POST | `/api/auth/logout/` | Auth | Blacklist refresh token |
| GET/POST | `/api/employees/` | HR/Manager | List or create employees |
| GET/PUT/DELETE | `/api/employees/{id}/` | HR/Manager | Employee detail |
| GET | `/api/employees/{id}/performance/` | HR/Manager/Self | Performance history |
| GET/POST | `/api/projects/` | HR/Manager | Projects |
| PATCH | `/api/projects/{id}/progress/` | Manager | Update project progress |
| GET/POST | `/api/okr/objectives/` | All | OKR objectives |
| PATCH | `/api/okr/key-results/{id}/` | All | Update key result |
| GET/POST | `/api/feedback/` | All | Peer feedback |
| GET | `/api/analytics/predictions/` | HR/Manager | Predictive analytics |
| GET | `/api/analytics/attrition-risk/` | HR | Attrition risk scores |
| GET | `/api/notifications/` | All | User notifications |
| POST | `/api/notifications/{id}/read/` | All | Mark as read |
| GET | `/api/onboarding/` | HR | All onboarding records |
| GET | `/api/onboarding/me/` | Employee | Own onboarding |
| POST | `/api/onboarding/{id}/complete-step/` | Employee | Complete step |
| GET | `/api/reports/performance-pdf/` | HR | PDF report |
| GET | `/api/reports/employees-csv/` | HR | CSV export |
| GET | `/api/hr/dashboard/` | HR | HR dashboard stats |
| GET | `/api/manager/dashboard/` | Manager | Manager dashboard stats |
| GET | `/api/employee/dashboard/` | Employee | Employee dashboard stats |

---

## 8. AI Performance Engine

### 8.1 Scoring Algorithm

```python
# apps/analytics/ai_engine.py
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import json

WEIGHTS = {
    'task_completion_rate': 0.30,
    'productivity_score':   0.25,
    'attendance_score':     0.20,
    'work_quality_score':   0.15,
    'peer_feedback_avg':    0.10,
}

def calculate_ai_score(performance_data: dict) -> dict:
    """
    Compute a weighted AI performance score and generate insights.
    performance_data keys: task_completion_rate, productivity_score,
    attendance_score, work_quality_score, peer_feedback_avg
    """
    score = sum(performance_data.get(k, 0) * w for k, w in WEIGHTS.items())
    score = round(min(max(score, 0), 100), 2)

    insights = []
    recommendations = []

    if performance_data.get('task_completion_rate', 0) < 70:
        insights.append("Task completion is below target. Focus on prioritisation.")
        recommendations.append("Schedule weekly task reviews with your manager.")

    if performance_data.get('attendance_score', 0) < 80:
        insights.append("Attendance needs improvement.")
        recommendations.append("Review attendance policy and address root causes.")

    if performance_data.get('peer_feedback_avg', 0) < 3:
        insights.append("Peer feedback indicates collaboration challenges.")
        recommendations.append("Participate in team-building activities.")

    if score >= 85:
        insights.append("Excellent overall performance — promotion eligible.")

    return {
        'ai_score': score,
        'grade': _grade(score),
        'insights': insights,
        'recommendations': recommendations,
    }

def _grade(score: float) -> str:
    if score >= 90: return 'A+'
    if score >= 80: return 'A'
    if score >= 70: return 'B'
    if score >= 60: return 'C'
    return 'D'


class PerformancePredictionModel:
    """Train a Random Forest on historical records to predict future scores."""

    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False

    def train(self, historical_records: list[dict]):
        if len(historical_records) < 10:
            return False
        X = np.array([[
            r['task_completion_rate'],
            r['productivity_score'],
            r['attendance_score'],
            r['work_quality_score'],
            r['peer_feedback_avg'],
        ] for r in historical_records])
        y = np.array([r['overall_rating'] for r in historical_records])
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.is_trained = True
        return True

    def predict(self, features: dict) -> float:
        if not self.is_trained:
            return 0.0
        X = np.array([[
            features.get('task_completion_rate', 0),
            features.get('productivity_score', 0),
            features.get('attendance_score', 0),
            features.get('work_quality_score', 0),
            features.get('peer_feedback_avg', 0),
        ]])
        X_scaled = self.scaler.transform(X)
        return round(float(self.model.predict(X_scaled)[0]), 2)


def calculate_attrition_risk(employee_data: dict) -> dict:
    """
    Heuristic attrition risk scoring.
    Returns risk_score (0–100) and risk_level.
    """
    risk = 0
    factors = []

    if employee_data.get('ai_score', 100) < 50:
        risk += 30
        factors.append("Consistently low performance score")

    if employee_data.get('tenure_years', 10) < 1:
        risk += 20
        factors.append("Less than 1 year tenure")

    if employee_data.get('feedback_avg', 5) < 2.5:
        risk += 25
        factors.append("Low peer feedback rating")

    if not employee_data.get('has_active_okr', True):
        risk += 15
        factors.append("No active OKR goals")

    if employee_data.get('absenteeism_rate', 0) > 15:
        risk += 10
        factors.append("High absenteeism rate")

    risk = min(risk, 100)
    level = 'high' if risk >= 60 else 'medium' if risk >= 30 else 'low'
    return {'risk_score': risk, 'risk_level': level, 'factors': factors}
```

### 8.2 Analytics View

```python
# apps/analytics/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.permissions import IsManager, IsHRAdmin
from apps.employees.models import Employee
from apps.performance.models import PerformanceRecord
from .ai_engine import calculate_ai_score, calculate_attrition_risk, PerformancePredictionModel

class AIPerformanceAnalysisView(APIView):
    permission_classes = [IsManager]

    def get(self, request, employee_id):
        employee = Employee.objects.get(pk=employee_id)
        latest = PerformanceRecord.objects.filter(employee=employee).first()
        if not latest:
            return Response({'error': 'No performance data found.'}, status=404)
        result = calculate_ai_score({
            'task_completion_rate': latest.task_completion_rate,
            'productivity_score':   latest.productivity_score,
            'attendance_score':     latest.attendance_score,
            'work_quality_score':   latest.work_quality_score,
            'peer_feedback_avg':    employee.received_feedback.aggregate(
                                        avg=models.Avg('rating'))['avg'] or 0,
        })
        latest.ai_score = result['ai_score']
        latest.ai_insights = result
        latest.save()
        return Response(result)

class AttritionRiskView(APIView):
    permission_classes = [IsHRAdmin]

    def get(self, request):
        employees = Employee.objects.filter(status='active').select_related('user')
        data = []
        for emp in employees:
            latest = PerformanceRecord.objects.filter(employee=emp).first()
            tenure = (date.today() - emp.date_of_joining).days / 365
            risk = calculate_attrition_risk({
                'ai_score':       latest.ai_score if latest else 50,
                'tenure_years':   tenure,
                'feedback_avg':   emp.received_feedback.aggregate(
                                      avg=models.Avg('rating'))['avg'] or 3,
                'has_active_okr': emp.objectives.filter(is_active=True).exists(),
            })
            data.append({'employee_id': emp.pk, 'name': emp.user.get_full_name(), **risk})
        return Response(sorted(data, key=lambda x: -x['risk_score']))
```

---

## 9. Frontend Setup (React + Vite)

### 9.1 Install Dependencies

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install axios react-router-dom zustand recharts \
    @tanstack/react-query react-hot-toast \
    lucide-react date-fns jspdf papaparse \
    tailwindcss @tailwindcss/forms @tailwindcss/typography
npx tailwindcss init -p
```

### 9.2 Axios Client with JWT Interceptors

```javascript
// src/api/client.js
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh/`, { refresh });
        localStorage.setItem('access_token', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
```

### 9.3 Auth Store (Zustand)

```javascript
// src/store/authStore.js
import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,

  login: (access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    const decoded = jwtDecode(access);
    set({ user: decoded, isAuthenticated: true });
  },

  logout: () => {
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  },

  initFromStorage: () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          set({ user: decoded, isAuthenticated: true });
        }
      } catch {
        localStorage.clear();
      }
    }
  },
}));
```

---

## 10. Frontend Architecture & Routes

```jsx
// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import HRDashboard from './pages/hr/HRDashboard';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* HR Routes */}
      <Route path="/hr" element={<ProtectedRoute role="hr" />}>
        <Route path="dashboard" element={<HRDashboard />} />
        <Route path="employees" element={<EmployeeManagement />} />
        <Route path="analytics" element={<HRAnalytics />} />
        <Route path="onboarding" element={<OnboardingManagement />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Manager Routes */}
      <Route path="/manager" element={<ProtectedRoute role="manager" />}>
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="team" element={<TeamManagement />} />
        <Route path="projects" element={<ProjectManagement />} />
        <Route path="performance" element={<PerformanceTracking />} />
      </Route>

      {/* Employee Routes */}
      <Route path="/employee" element={<ProtectedRoute role="employee" />}>
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="goals" element={<OKRView />} />
        <Route path="feedback" element={<FeedbackView />} />
        <Route path="projects" element={<MyProjects />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
```

```jsx
// src/auth/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ role }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role && user?.role !== role && !(role === 'manager' && user?.role === 'hr')) {
    return <Navigate to={`/${user.role}/dashboard`} />;
  }
  return <Outlet />;
}
```

---

## 11. Dashboard Modules

### 11.1 HR Dashboard Stats API

```python
# apps/accounts/views.py
class HRDashboardView(APIView):
    permission_classes = [IsHRAdmin]

    def get(self, request):
        from django.db.models import Avg, Count
        employees = Employee.objects.filter(status='active')
        return Response({
            'total_employees':     employees.count(),
            'avg_performance':     PerformanceRecord.objects.aggregate(avg=Avg('ai_score'))['avg'] or 0,
            'promotion_eligible':  employees.filter(promotion_eligible=True).count(),
            'attrition_risk_high': self._high_risk_count(),
            'departments':         employees.values('department').annotate(count=Count('id')),
            'recent_hires':        Employee.objects.order_by('-date_of_joining')[:5].values(
                                       'user__first_name', 'user__last_name', 'department', 'date_of_joining'),
        })

    def _high_risk_count(self):
        # Simplified — integrate with AI engine for real count
        return Employee.objects.filter(performance_records__ai_score__lt=40).distinct().count()
```

### 11.2 HR Dashboard React Component

```jsx
// src/pages/hr/HRDashboard.jsx
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import KPICard from '../../components/KPICard';
import WorkforceChart from '../../components/charts/WorkforceChart';

export default function HRDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['hr-dashboard'],
    queryFn: () => api.get('/hr/dashboard/').then(r => r.data),
  });

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Employees"  value={data.total_employees}  icon="users"   color="blue" />
        <KPICard title="Avg Performance"  value={`${data.avg_performance.toFixed(1)}%`} icon="chart" color="green" />
        <KPICard title="Promotion Ready"  value={data.promotion_eligible} icon="star"  color="yellow" />
        <KPICard title="High Attrition Risk" value={data.attrition_risk_high} icon="alert" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkforceChart data={data.departments} />
        <RecentHiresTable data={data.recent_hires} />
      </div>
    </div>
  );
}
```

---

## 12. OKR Management

```python
# apps/okr/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

class ObjectiveViewSet(viewsets.ModelViewSet):
    serializer_class = ObjectiveSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'hr':
            return Objective.objects.all()
        if user.role == 'manager':
            team_ids = Employee.objects.filter(manager__user=user).values_list('id', flat=True)
            return Objective.objects.filter(owner_id__in=team_ids) | \
                   Objective.objects.filter(owner__user=user)
        return Objective.objects.filter(owner__user=user)

    @action(detail=True, methods=['get'])
    def progress_summary(self, request, pk=None):
        obj = self.get_object()
        krs = obj.key_results.all()
        return Response({
            'objective': obj.title,
            'overall_progress': obj.progress,
            'key_results': [
                {'title': kr.title, 'progress': kr.progress_percentage,
                 'current': kr.current_value, 'target': kr.target_value}
                for kr in krs
            ]
        })
```

---

## 13. Peer Feedback System

```python
# apps/feedback/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import PeerFeedback
from .serializers import PeerFeedbackSerializer

class PeerFeedbackViewSet(viewsets.ModelViewSet):
    serializer_class = PeerFeedbackSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'hr':
            return PeerFeedback.objects.all()
        emp = user.employee
        return PeerFeedback.objects.filter(reviewee=emp) | \
               PeerFeedback.objects.filter(reviewer=emp)

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user.employee)
        # Trigger notification to reviewee
        from apps.notifications.tasks import send_notification
        reviewee = serializer.instance.reviewee
        send_notification.delay(
            user_id=reviewee.user_id,
            type='feedback',
            title='New Peer Feedback',
            message=f'You received new feedback from a colleague.',
        )
```

---

## 14. Predictive Analytics

```python
# apps/analytics/views.py
class PerformanceTrendView(APIView):
    permission_classes = [IsManager]

    def get(self, request, employee_id):
        records = PerformanceRecord.objects.filter(
            employee_id=employee_id
        ).order_by('period_start').values(
            'period_start', 'task_completion_rate',
            'productivity_score', 'overall_rating', 'ai_score'
        )
        return Response({'trend': list(records)})

class PredictNextQuarterView(APIView):
    permission_classes = [IsManager]

    def get(self, request, employee_id):
        historical = list(PerformanceRecord.objects.filter(
            employee_id=employee_id
        ).order_by('period_start').values(
            'task_completion_rate', 'productivity_score',
            'attendance_score', 'work_quality_score', 'overall_rating'
        ))
        if len(historical) < 3:
            return Response({'error': 'Insufficient data for prediction'}, status=400)
        # Add peer feedback avg to each record
        emp = Employee.objects.get(pk=employee_id)
        avg_feedback = emp.received_feedback.aggregate(avg=Avg('rating'))['avg'] or 3
        for r in historical:
            r['peer_feedback_avg'] = avg_feedback
        model = PerformancePredictionModel()
        model.train(historical)
        latest = historical[-1]
        predicted = model.predict(latest)
        return Response({
            'predicted_score': predicted,
            'trend': 'improving' if predicted > latest['overall_rating'] else 'declining',
            'confidence': 'medium' if len(historical) < 6 else 'high',
        })
```

---

## 15. Real-Time Notifications

### 15.1 Django Channels Consumer

```python
# apps/notifications/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if not self.user.is_authenticated:
            await self.close()
            return
        self.group_name = f'notifications_{self.user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def notification_message(self, event):
        await self.send(text_data=json.dumps(event['notification']))
```

### 15.2 Celery Task to Push Notification

```python
# apps/notifications/tasks.py
from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification

@shared_task
def send_notification(user_id, type, title, message):
    notif = Notification.objects.create(
        recipient_id=user_id, type=type, title=title, message=message
    )
    layer = get_channel_layer()
    async_to_sync(layer.group_send)(
        f'notifications_{user_id}',
        {'type': 'notification_message', 'notification': {
            'id': notif.id, 'type': type, 'title': title, 'message': message,
        }}
    )
```

### 15.3 Frontend WebSocket Hook

```javascript
// src/hooks/useNotifications.js
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function useNotifications() {
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('access_token');
    const ws = new WebSocket(
      `${import.meta.env.VITE_WS_URL}/ws/notifications/?token=${token}`
    );
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setNotifications(prev => [data, ...prev]);
      toast(data.title, { icon: '🔔' });
    };
    return () => ws.close();
  }, [isAuthenticated]);

  return notifications;
}
```

---

## 16. Onboarding Management

```python
# apps/onboarding/views.py
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

class OnboardingViewSet(viewsets.ModelViewSet):

    @action(detail=True, methods=['post'])
    def complete_step(self, request, pk=None):
        record = self.get_object()
        step_id = request.data.get('step_id')
        if step_id not in record.completed_steps:
            record.completed_steps.append(step_id)
        total_steps = len(record.template.steps)
        record.progress_percentage = (len(record.completed_steps) / total_steps) * 100
        if record.progress_percentage >= 100:
            record.is_complete = True
            record.completed_at = timezone.now()
        record.save()
        return Response({'progress': record.progress_percentage, 'is_complete': record.is_complete})
```

---

## 17. Data Visualization

```jsx
// src/components/charts/PerformanceTrendChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PerformanceTrendChart({ data }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-4">Performance Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period_start" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="overall_rating" stroke="#3B82F6" name="Rating" strokeWidth={2} />
          <Line type="monotone" dataKey="ai_score"       stroke="#10B981" name="AI Score" strokeWidth={2} />
          <Line type="monotone" dataKey="productivity_score" stroke="#F59E0B" name="Productivity" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 18. Report Generation (PDF & CSV)

### 18.1 PDF Export (Backend)

```python
# apps/reports/views.py
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from django.http import HttpResponse
import io

class PerformancePDFReportView(APIView):
    permission_classes = [IsHRAdmin]

    def get(self, request):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = [Paragraph("PerfTrack — Performance Report", styles['Title'])]

        records = PerformanceRecord.objects.select_related('employee__user').order_by('-period_start')[:50]
        table_data = [['Employee', 'Period', 'Task %', 'Productivity', 'AI Score', 'Grade']]
        for r in records:
            ai = r.ai_insights or {}
            table_data.append([
                r.employee.user.get_full_name(),
                str(r.period_start),
                f"{r.task_completion_rate:.1f}%",
                f"{r.productivity_score:.1f}",
                f"{r.ai_score or 0:.1f}",
                ai.get('grade', 'N/A'),
            ])

        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3B82F6')),
            ('TEXTCOLOR',  (0, 0), (-1, 0), colors.white),
            ('FONTNAME',   (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F4F6')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ]))
        elements.append(table)
        doc.build(elements)
        buffer.seek(0)
        return HttpResponse(buffer, content_type='application/pdf',
                            headers={'Content-Disposition': 'attachment; filename="performance_report.pdf"'})
```

### 18.2 CSV Export (Frontend)

```javascript
// src/utils/exportCSV.js
import Papa from 'papaparse';

export function downloadCSV(data, filename = 'export.csv') {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

---

## 19. Environment Configuration

**`backend/.env`**
```env
SECRET_KEY=your-django-secret-key-here
DEBUG=True
DB_NAME=perftrack_db
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
```

---

## 20. Deployment

### 20.1 Backend (Gunicorn + NGINX)

```bash
# Install
pip install gunicorn

# Run ASGI with Daphne (supports WebSockets)
daphne -b 0.0.0.0 -p 8000 config.asgi:application

# Or run Gunicorn for HTTP only
gunicorn config.wsgi:application --workers 4 --bind 0.0.0.0:8000
```

**`nginx.conf` (minimal)**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        root /var/www/perftrack/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### 20.2 Frontend Build

```bash
npm run build
# Outputs to dist/ — serve via NGINX
```

### 20.3 Celery Worker

```bash
celery -A config worker --loglevel=info
celery -A config beat   --loglevel=info   # for periodic tasks
```

### 20.4 Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### 20.5 Docker Compose (Optional)

```yaml
# docker-compose.yml
version: '3.9'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: perftrack_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  backend:
    build: ./backend
    command: daphne -b 0.0.0.0 -p 8000 config.asgi:application
    env_file: ./backend/.env
    depends_on: [db, redis]
    ports:
      - "8000:8000"

  celery:
    build: ./backend
    command: celery -A config worker --loglevel=info
    env_file: ./backend/.env
    depends_on: [db, redis]

  frontend:
    build: ./frontend
    ports:
      - "5173:80"

volumes:
  pgdata:
```

---

## Quick Start Checklist

- [ ] Clone repository and create `.env` files
- [ ] Run `pip install -r requirements.txt`
- [ ] Run `python manage.py migrate && python manage.py createsuperuser`
- [ ] Start Redis: `redis-server`
- [ ] Start Django: `python manage.py runserver` (dev) or `daphne` (prod)
- [ ] Start Celery: `celery -A config worker`
- [ ] Run `npm install && npm run dev` in `frontend/`
- [ ] Visit `http://localhost:5173` and log in

---

*PerfTrack AI — Built with Django REST Framework, React, and scikit-learn*
