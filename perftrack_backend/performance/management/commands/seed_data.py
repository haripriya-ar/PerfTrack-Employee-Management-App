from django.core.management.base import BaseCommand
from datetime import date, timedelta
from accounts.models import User, Department
from performance.models import EvaluationPeriod, PerformanceRecord
from performance.ml_model import engine


class Command(BaseCommand):
    help = 'Seed the database with sample PerfTrack data'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing data first')

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            PerformanceRecord.objects.all().delete()
            EvaluationPeriod.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            Department.objects.all().delete()

        self.stdout.write('Creating departments...')
        eng = Department.objects.get_or_create(name='Engineering', defaults={'description': 'Software engineering team'})[0]
        des = Department.objects.get_or_create(name='Design', defaults={'description': 'UX and visual design team'})[0]
        mgmt = Department.objects.get_or_create(name='Management', defaults={'description': 'Executive and operations'})[0]

        admin = User.objects.filter(email='admin@acme.com').first()
        if not admin:
            admin = User.objects.create_user(
                email='admin@acme.com', password='Admin@123',
                first_name='Sarah', last_name='Chen',
                role='admin', department=mgmt, is_staff=True,
            )
            self.stdout.write(f'  Created admin: {admin.email}')

        manager1 = User.objects.filter(email='marcus@acme.com').first()
        if not manager1:
            manager1 = User.objects.create_user(
                email='marcus@acme.com', password='Manager@123',
                first_name='Marcus', last_name='Webb',
                role='manager', department=eng,
            )

        manager2 = User.objects.filter(email='priya@acme.com').first()
        if not manager2:
            manager2 = User.objects.create_user(
                email='priya@acme.com', password='Manager@123',
                first_name='Priya', last_name='Nair',
                role='manager', department=des,
            )

        employee_data = [
            ('Jordan', 'Lee', 'jordan@acme.com', eng, manager1,
             [82, 88, 91, 79, 95, 89], [74, 80, 85, 78, 90, 87], [95, 97, 100, 92, 98, 96], [3.8, 4.0, 4.2, 3.9, 4.5, 4.3]),
            ('Alex', 'Rivera', 'alex@acme.com', eng, manager1,
             [70, 75, 68, 80, 84, 82], [65, 70, 72, 78, 80, 79], [88, 90, 85, 93, 91, 94], [3.2, 3.5, 3.4, 3.7, 3.9, 3.8]),
            ('Maya', 'Patel', 'maya@acme.com', des, manager2,
             [90, 88, 93, 95, 97, 96], [88, 91, 89, 94, 96, 95], [100, 98, 100, 100, 99, 100], [4.5, 4.4, 4.6, 4.7, 4.8, 4.9]),
            ('Tom', 'Nguyen', 'tom@acme.com', eng, manager1,
             [60, 65, 70, 68, 72, 75], [58, 62, 65, 63, 68, 71], [80, 85, 82, 88, 86, 90], [2.8, 3.0, 3.1, 3.2, 3.3, 3.5]),
        ]

        employees = []
        for first, last, email, dept, mgr, tasks, prod, attend, ratings in employee_data:
            emp = User.objects.filter(email=email).first()
            if not emp:
                emp = User.objects.create_user(
                    email=email, password='Employee@123',
                    first_name=first, last_name=last,
                    role='employee', department=dept, manager=mgr,
                )
            employees.append((emp, tasks, prod, attend, ratings))
            self.stdout.write(f'  Employee: {emp.full_name}')

        self.stdout.write('Creating evaluation periods...')
        period_names = ['November 2024', 'December 2024', 'January 2025', 'February 2025', 'March 2025', 'April 2025']
        period_dates = [
            (date(2024, 11, 1), date(2024, 11, 30)),
            (date(2024, 12, 1), date(2024, 12, 31)),
            (date(2025, 1, 1), date(2025, 1, 31)),
            (date(2025, 2, 1), date(2025, 2, 28)),
            (date(2025, 3, 1), date(2025, 3, 31)),
            (date(2025, 4, 1), date(2025, 4, 30)),
        ]
        periods = []
        for i, name in enumerate(period_names):
            start, end = period_dates[i]
            p, _ = EvaluationPeriod.objects.get_or_create(
                name=name,
                defaults={'start_date': start, 'end_date': end, 'is_active': i == 5, 'created_by': admin}
            )
            periods.append(p)

        self.stdout.write('Creating performance records...')
        for emp, tasks, prod, attend, ratings in employees:
            for i, period in enumerate(periods):
                if not PerformanceRecord.objects.filter(employee=emp, period=period).exists():
                    PerformanceRecord.objects.create(
                        employee=emp,
                        period=period,
                        evaluated_by=emp.manager,
                        task_completion=tasks[i],
                        productivity=prod[i],
                        attendance=attend[i],
                        rating=ratings[i],
                        notes=f'Auto-seeded record for {period.name}',
                    )

        self.stdout.write('Training ML model...')
        metrics = engine.train(force=True)
        self.stdout.write(f'  Model status: {metrics}')

        self.stdout.write(self.style.SUCCESS('\n✅ Seed complete! Login credentials:'))
        self.stdout.write('  Admin:    admin@acme.com    / Admin@123')
        self.stdout.write('  Manager:  marcus@acme.com   / Manager@123')
        self.stdout.write('  Employee: jordan@acme.com   / Employee@123')