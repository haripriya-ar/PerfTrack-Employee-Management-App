import csv
import io

from django.db.models import Avg, Count, F, Q
from django.http import HttpResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from accounts.models import User
from accounts.permissions import IsAdminOrManager
from performance.models import PerformanceRecord, EvaluationPeriod


# ─── Company Report ───────────────────────────────────────────────────────────
class CompanyReportView(APIView):
    """Aggregated company-wide analytics for the admin dashboard."""
    permission_classes = [IsAdminOrManager]

    def get(self, request):
        records = PerformanceRecord.objects.select_related(
            'employee', 'employee__department', 'period',
        )

        # Department statistics
        department_stats = list(
            records.values('employee__department__name').annotate(
                avg_task=Avg('task_completion'),
                avg_prod=Avg('productivity'),
                avg_attend=Avg('attendance'),
                avg_rating=Avg('rating'),
                count=Count('id'),
            ).order_by('employee__department__name')
        )

        # Top performers (avg task_completion >= 80, ordered desc)
        top_performers = list(
            records.values(
                'employee__id',
                'employee__first_name',
                'employee__last_name',
                'employee__avatar_initials',
            ).annotate(
                avg_task=Avg('task_completion'),
            ).filter(avg_task__gte=75).order_by('-avg_task')[:10]
        )

        # Needs attention (avg task_completion < 75)
        needs_attention = list(
            records.values(
                'employee__id',
                'employee__first_name',
                'employee__last_name',
            ).annotate(
                avg_task=Avg('task_completion'),
            ).filter(avg_task__lt=75).order_by('avg_task')[:10]
        )

        # Trend by evaluation period
        period_trend = list(
            records.values('period__name').annotate(
                avg_task=Avg('task_completion'),
                avg_prod=Avg('productivity'),
                avg_attend=Avg('attendance'),
                avg_rating=Avg('rating'),
                count=Count('id'),
            ).order_by('period__start_date')
        )

        return Response({
            'department_stats': department_stats,
            'top_performers': top_performers,
            'needs_attention': needs_attention,
            'period_trend': period_trend,
            'total_evaluations': records.count(),
        })


# ─── Employee Report ──────────────────────────────────────────────────────────
class EmployeeReportView(APIView):
    """Detailed performance report for a specific employee."""
    permission_classes = [IsAuthenticated]

    def get(self, request, employee_id):
        user = request.user
        # Employees can only see their own report
        if user.role == 'employee' and user.id != employee_id:
            return Response({'detail': 'Forbidden'}, status=403)

        records = PerformanceRecord.objects.filter(
            employee_id=employee_id,
        ).select_related('period', 'evaluated_by').order_by('period__start_date')

        data = []
        for r in records:
            data.append({
                'period': r.period.name,
                'task_completion': r.task_completion,
                'productivity': r.productivity,
                'attendance': r.attendance,
                'rating': r.rating,
                'predicted_score': r.predicted_score,
                'composite_score': r.composite_score,
                'evaluated_by': r.evaluated_by.full_name if r.evaluated_by else None,
                'created_at': r.created_at,
            })

        # Averages
        avg = records.aggregate(
            avg_task=Avg('task_completion'),
            avg_prod=Avg('productivity'),
            avg_attend=Avg('attendance'),
            avg_rating=Avg('rating'),
        )

        try:
            employee = User.objects.select_related('department').get(id=employee_id)
            emp_info = {
                'full_name': employee.full_name,
                'department': employee.department.name if employee.department else '',
                'role': employee.role,
                'email': employee.email,
            }
        except User.DoesNotExist:
            emp_info = {}

        return Response({
            'employee': emp_info,
            'records': data,
            'averages': avg,
        })


# ─── Team Report ──────────────────────────────────────────────────────────────
class TeamReportView(APIView):
    """Team report for a manager's direct reports."""
    permission_classes = [IsAdminOrManager]

    def get(self, request):
        user = request.user

        if user.role == 'admin':
            employees = User.objects.filter(role='employee')
        else:
            employees = User.objects.filter(manager=user, role='employee')

        team_data = []
        for emp in employees.select_related('department'):
            avg = PerformanceRecord.objects.filter(employee=emp).aggregate(
                avg_task=Avg('task_completion'),
                avg_prod=Avg('productivity'),
                avg_attend=Avg('attendance'),
                avg_rating=Avg('rating'),
                count=Count('id'),
            )
            team_data.append({
                'id': emp.id,
                'full_name': emp.full_name,
                'department': emp.department.name if emp.department else '',
                'avatar_initials': emp.avatar_initials,
                **avg,
            })

        return Response(team_data)


# ─── Performance PDF Report ──────────────────────────────────────────────────
class PerformancePDFReportView(APIView):
    """Generate a downloadable PDF performance report."""
    permission_classes = [IsAdminOrManager]

    def get(self, request):
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib import colors
            from reportlab.platypus import (
                SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
            )
            from reportlab.lib.styles import getSampleStyleSheet
        except ImportError:
            return Response(
                {'detail': 'ReportLab is not installed on the server.'},
                status=500,
            )

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        elements.append(Paragraph('PerfTrack — Performance Report', styles['Title']))
        elements.append(Spacer(1, 20))

        # Gather data
        records = PerformanceRecord.objects.select_related(
            'employee', 'employee__department', 'period',
        ).order_by('employee__first_name', '-period__start_date')

        table_data = [
            ['Employee', 'Department', 'Period', 'Tasks %', 'Prod %', 'Attend %', 'Rating'],
        ]
        for r in records:
            table_data.append([
                r.employee.full_name,
                r.employee.department.name if r.employee.department else '—',
                r.period.name,
                f'{r.task_completion:.0f}',
                f'{r.productivity:.0f}',
                f'{r.attendance:.0f}',
                f'{r.rating:.1f}',
            ])

        if len(table_data) > 1:
            t = Table(table_data, repeatRows=1)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6c63ff')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
                ('ALIGN', (3, 0), (-1, -1), 'CENTER'),
            ]))
            elements.append(t)
        else:
            elements.append(Paragraph('No performance records found.', styles['Normal']))

        doc.build(elements)
        buf.seek(0)

        response = HttpResponse(buf.read(), content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="performance_report.pdf"'
        return response


# ─── Employee CSV Export ─────────────────────────────────────────────────────
class EmployeeCSVExportView(APIView):
    """Export all employee performance data as CSV."""
    permission_classes = [IsAdminOrManager]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="employees_export.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Employee', 'Email', 'Department', 'Period',
            'Task Completion', 'Productivity', 'Attendance',
            'Rating', 'Predicted Score', 'Composite Score',
        ])

        records = PerformanceRecord.objects.select_related(
            'employee', 'employee__department', 'period',
        ).order_by('employee__first_name', '-period__start_date')

        for r in records:
            writer.writerow([
                r.employee.full_name,
                r.employee.email,
                r.employee.department.name if r.employee.department else '',
                r.period.name,
                f'{r.task_completion:.1f}',
                f'{r.productivity:.1f}',
                f'{r.attendance:.1f}',
                f'{r.rating:.1f}',
                f'{r.predicted_score:.1f}' if r.predicted_score else '',
                f'{r.composite_score:.1f}',
            ])

        return response


# ─── Employee Dropdown (for Feedback page) ────────────────────────────────────
class EmployeeListView(APIView):
    """Simple employee list for dropdowns — available to all authenticated users."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employees = User.objects.filter(
            role='employee', is_active=True,
        ).select_related('department')

        data = []
        for emp in employees:
            data.append({
                'id': emp.id,
                'full_name': emp.full_name,
                'department': emp.department.name if emp.department else '',
                'email': emp.email,
                'avatar_initials': emp.avatar_initials,
            })

        return Response(data)