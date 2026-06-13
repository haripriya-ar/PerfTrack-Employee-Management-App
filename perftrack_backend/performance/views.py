from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import PerformanceRecord, EvaluationPeriod, Goal
from .serializers import (
    PerformanceRecordSerializer, PerformanceRecordCreateSerializer,
    EvaluationPeriodSerializer, GoalSerializer
)
from .ml_model import engine
from accounts.models import User
from accounts.permissions import IsAdminOrManager, IsAdmin, IsOwnerOrAdminOrManager


class EvaluationPeriodListView(generics.ListCreateAPIView):
    serializer_class = EvaluationPeriodSerializer
    queryset = EvaluationPeriod.objects.all()

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAuthenticated()]


class PerformanceRecordListView(generics.ListAPIView):
    serializer_class = PerformanceRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = PerformanceRecord.objects.select_related(
            'employee', 'period', 'evaluated_by',
            'employee__department', 'employee__manager'
        )
        if user.role == 'employee':
            qs = qs.filter(employee=user)
        elif user.role == 'manager':
            qs = qs.filter(employee__manager=user)
        employee_id = self.request.query_params.get('employee')
        period_id = self.request.query_params.get('period')
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        if period_id:
            qs = qs.filter(period_id=period_id)
        return qs


class PerformanceRecordCreateView(generics.CreateAPIView):
    serializer_class = PerformanceRecordCreateSerializer
    permission_classes = [IsAdminOrManager]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        record = serializer.save()
        return Response(
            PerformanceRecordSerializer(record).data,
            status=status.HTTP_201_CREATED
        )


class PerformanceRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdminOrManager]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return PerformanceRecordCreateSerializer
        return PerformanceRecordSerializer

    def get_queryset(self):
        return PerformanceRecord.objects.select_related(
            'employee', 'period', 'evaluated_by'
        )


class PredictView(APIView):
    permission_classes = [IsAdminOrManager]

    def post(self, request):
        data = request.data
        try:
            task_completion = float(data['task_completion'])
            productivity = float(data['productivity'])
            attendance = float(data['attendance'])
            rating = float(data['rating'])
        except (KeyError, ValueError, TypeError) as e:
            return Response({'error': f'Invalid input: {e}'}, status=status.HTTP_400_BAD_REQUEST)
        engine.train()
        result = engine.predict(task_completion, productivity, attendance, rating)
        return Response(result)


class TrainModelView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        metrics = engine.train(force=True)
        return Response(metrics)


class EmployeeStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, employee_id):
        user = request.user
        employee = get_object_or_404(User, id=employee_id, role='employee')
        if user.role == 'employee' and user.id != employee_id:
            return Response({'error': 'Forbidden'}, status=403)
        if user.role == 'manager' and employee.manager_id != user.id:
            return Response({'error': 'Forbidden'}, status=403)
        records = PerformanceRecord.objects.filter(employee=employee).select_related('period').order_by('period__start_date')
        if not records.exists():
            return Response({
                'employee_id': employee_id, 'records': [], 'averages': {},
                'avg_task': 0, 'avg_prod': 0, 'avg_attend': 0, 'avg_rating': 0,
                'latest_prediction': None, 'total_periods': 0, 'history': [],
            })
        averages = records.aggregate(
            avg_task=Avg('task_completion'),
            avg_prod=Avg('productivity'),
            avg_attend=Avg('attendance'),
            avg_rating=Avg('rating'),
        )
        serialized = PerformanceRecordSerializer(records, many=True).data
        latest = records.last()

        # Build history array for frontend charts
        history = []
        for r in records:
            history.append({
                'period_name': r.period.name if r.period else '',
                'period': r.period.name if r.period else '',
                'task_completion': r.task_completion,
                'productivity_score': r.productivity,
                'attendance_percentage': r.attendance,
                'manager_rating': r.rating,
                'predicted_score': r.predicted_score,
                'composite_score': r.composite_score,
            })

        # Current record (latest) for the dashboard cards
        current = None
        if latest:
            current = {
                'task_completion': latest.task_completion,
                'productivity_score': latest.productivity,
                'attendance_percentage': latest.attendance,
                'manager_rating': latest.rating,
            }

        avg_clean = {k: round(v, 2) if v else 0 for k, v in averages.items()}
        return Response({
            'employee': {
                'id': employee.id,
                'name': employee.full_name,
                'email': employee.email,
                'avatar': employee.avatar_initials,
                'department': employee.department.name if employee.department else None,
            },
            'records': serialized,
            'averages': avg_clean,
            'current': current,
            'history': history,
            'latest_prediction': latest.predicted_score if latest else None,
            'total_periods': records.count(),
            # Flatten averages to root for frontend compatibility
            'avg_task': avg_clean.get('avg_task', 0),
            'avg_prod': avg_clean.get('avg_prod', 0),
            'avg_attend': avg_clean.get('avg_attend', 0),
            'avg_rating': avg_clean.get('avg_rating', 0),
        })


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'admin':
            total_employees = User.objects.filter(role='employee', is_active=True).count()
            total_managers = User.objects.filter(role='manager', is_active=True).count()
            total_evaluations = PerformanceRecord.objects.count()
            agg = PerformanceRecord.objects.aggregate(
                avg_task=Avg('task_completion'),
                avg_prod=Avg('productivity'),
                avg_attend=Avg('attendance'),
                avg_rating=Avg('rating'),
            )
            return Response({
                'role': 'admin',
                'total_employees': total_employees,
                'total_managers': total_managers,
                'total_evaluations': total_evaluations,
                'company_averages': {k: round(v, 2) if v else 0 for k, v in agg.items()},
            })
        elif user.role == 'manager':
            team = User.objects.filter(manager=user, is_active=True)
            team_ids = team.values_list('id', flat=True)
            agg = PerformanceRecord.objects.filter(employee_id__in=team_ids).aggregate(
                avg_task=Avg('task_completion'),
                avg_prod=Avg('productivity'),
            )
            low_performers = PerformanceRecord.objects.filter(
                employee_id__in=team_ids, task_completion__lt=75
            ).values('employee_id').distinct().count()
            return Response({
                'role': 'manager',
                'team_size': team.count(),
                'team_averages': {k: round(v, 2) if v else 0 for k, v in agg.items()},
                'low_performers': low_performers,
            })
        else:
            records = PerformanceRecord.objects.filter(employee=user).order_by('-period__start_date')
            latest = records.first()
            return Response({
                'role': 'employee',
                'latest_record': PerformanceRecordSerializer(latest).data if latest else None,
                'total_records': records.count(),
            })


class GoalListCreateView(generics.ListCreateAPIView):
    serializer_class = GoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'employee':
            return Goal.objects.filter(employee=user)
        elif user.role == 'manager':
            return Goal.objects.filter(employee__manager=user)
        return Goal.objects.all()


class GoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GoalSerializer
    permission_classes = [IsAuthenticated]
    queryset = Goal.objects.select_related('employee', 'created_by')


class AttritionRiskView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from .ml_model import calculate_attrition_risk
        from datetime import date

        employees = User.objects.filter(role='employee', is_active=True).select_related('department')
        data = []
        for emp in employees:
            latest = PerformanceRecord.objects.filter(employee=emp).order_by('-period__start_date').first()
            tenure = (date.today() - emp.date_joined.date()).days / 365

            # Get feedback avg if feedback app exists
            feedback_avg = 3.0
            try:
                from feedback.models import PeerFeedback
                fb_avg = PeerFeedback.objects.filter(reviewee=emp).aggregate(avg=Avg('rating'))['avg']
                if fb_avg:
                    feedback_avg = fb_avg
            except Exception:
                pass

            # Check for active OKRs
            has_active_okr = True
            try:
                from okr.models import Objective
                has_active_okr = Objective.objects.filter(owner=emp, is_active=True).exists()
            except Exception:
                pass

            composite = latest.composite_score if latest else 50
            risk = calculate_attrition_risk({
                'ai_score': composite,
                'tenure_years': tenure,
                'feedback_avg': feedback_avg,
                'has_active_okr': has_active_okr,
                'absenteeism_rate': 100 - (latest.attendance if latest else 90),
            })
            data.append({
                'employee_id': emp.pk,
                'name': emp.full_name,
                'department': emp.department.name if emp.department else None,
                **risk,
            })
        return Response(sorted(data, key=lambda x: -x['risk_score']))


class EvaluationApprovalView(APIView):
    """HR (admin) can approve or reject a submitted evaluation."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        record = get_object_or_404(PerformanceRecord, pk=pk)
        action = request.data.get('action')  # 'approve' or 'reject'
        hr_comments = request.data.get('hr_comments', '')

        if action not in ('approve', 'reject'):
            return Response(
                {'error': 'action must be "approve" or "reject"'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        record.status = 'approved' if action == 'approve' else 'rejected'
        record.hr_comments = hr_comments
        record.approved_by = request.user
        record.approved_at = timezone.now()
        record.save()

        # Notify the employee and evaluator
        try:
            from notifications.models import Notification
            status_label = 'approved' if action == 'approve' else 'rejected'
            Notification.objects.create(
                recipient=record.employee,
                type='hr',
                title=f'Evaluation {status_label.capitalize()}',
                message=f'Your evaluation for {record.period.name} has been {status_label} by HR.',
            )
            if record.evaluated_by and record.evaluated_by != record.employee:
                Notification.objects.create(
                    recipient=record.evaluated_by,
                    type='hr',
                    title=f'Evaluation {status_label.capitalize()}',
                    message=f'Your evaluation of {record.employee.full_name} for {record.period.name} has been {status_label}.',
                )
        except Exception:
            pass

        return Response(PerformanceRecordSerializer(record).data)