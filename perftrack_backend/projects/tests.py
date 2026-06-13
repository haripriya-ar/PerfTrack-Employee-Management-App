from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, Department
from projects.models import Project
from notifications.models import Notification
from datetime import date, timedelta


class ProjectAPITests(TestCase):
    """Tests for Project assignment and notification flow."""

    def setUp(self):
        self.client = APIClient()
        self.dept = Department.objects.create(name='Engineering')

        self.admin = User.objects.create_user(
            email='admin@test.com', password='Test@1234',
            first_name='Admin', last_name='User', role='admin',
        )
        self.manager = User.objects.create_user(
            email='manager@test.com', password='Test@1234',
            first_name='Manager', last_name='User', role='manager',
            department=self.dept,
        )
        self.employee1 = User.objects.create_user(
            email='emp1@test.com', password='Test@1234',
            first_name='John', last_name='Doe', role='employee',
            department=self.dept, manager=self.manager,
        )
        self.employee2 = User.objects.create_user(
            email='emp2@test.com', password='Test@1234',
            first_name='Jane', last_name='Smith', role='employee',
            department=self.dept, manager=self.manager,
        )

    def test_create_project_with_employees(self):
        """Manager can create a project and assign employees."""
        self.client.force_authenticate(self.manager)
        res = self.client.post('/api/projects/', {
            'name': 'Test Project',
            'description': 'A test project',
            'status': 'active',
            'priority': 'high',
            'start_date': str(date.today()),
            'end_date': str(date.today() + timedelta(days=30)),
            'progress': 0,
            'manager': self.manager.id,
            'assigned_employees': [self.employee1.id, self.employee2.id],
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # Verify employees are assigned
        project = Project.objects.get(name='Test Project')
        self.assertEqual(project.assigned_employees.count(), 2)

    def test_project_assignment_creates_notifications(self):
        """Assigning employees should create notifications."""
        self.client.force_authenticate(self.manager)
        self.client.post('/api/projects/', {
            'name': 'Notification Test',
            'status': 'planning',
            'priority': 'medium',
            'start_date': str(date.today()),
            'end_date': str(date.today() + timedelta(days=30)),
            'manager': self.manager.id,
            'assigned_employees': [self.employee1.id],
        })

        notifs = Notification.objects.filter(
            recipient=self.employee1, type='project'
        )
        self.assertTrue(notifs.exists())
        self.assertIn('Notification Test', notifs.first().message)

    def test_employee_sees_assigned_projects(self):
        """Employee should see projects assigned to them."""
        self.client.force_authenticate(self.manager)
        self.client.post('/api/projects/', {
            'name': 'Employee Project',
            'status': 'active',
            'priority': 'medium',
            'start_date': str(date.today()),
            'end_date': str(date.today() + timedelta(days=30)),
            'manager': self.manager.id,
            'assigned_employees': [self.employee1.id],
        })

        # Now login as employee
        self.client.force_authenticate(self.employee1)
        res = self.client.get('/api/projects/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data.get('results', res.data)
        names = [p['name'] for p in data]
        self.assertIn('Employee Project', names)

    def test_employee_does_not_see_others_projects(self):
        """Employee2 should NOT see Employee1's project."""
        self.client.force_authenticate(self.manager)
        self.client.post('/api/projects/', {
            'name': 'Employee1 Only',
            'status': 'active',
            'priority': 'medium',
            'start_date': str(date.today()),
            'end_date': str(date.today() + timedelta(days=30)),
            'manager': self.manager.id,
            'assigned_employees': [self.employee1.id],
        })

        self.client.force_authenticate(self.employee2)
        res = self.client.get('/api/projects/')
        data = res.data.get('results', res.data)
        names = [p['name'] for p in data]
        self.assertNotIn('Employee1 Only', names)

    def test_employee_cannot_create_project(self):
        """Employees should not be able to create projects."""
        self.client.force_authenticate(self.employee1)
        res = self.client.post('/api/projects/', {
            'name': 'Illegal Project',
            'start_date': str(date.today()),
            'end_date': str(date.today() + timedelta(days=30)),
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_project_detail_accessible_to_assigned_employee(self):
        """Employee can access detail view of project they're assigned to."""
        self.client.force_authenticate(self.manager)
        res = self.client.post('/api/projects/', {
            'name': 'Detail Test',
            'status': 'active',
            'priority': 'medium',
            'start_date': str(date.today()),
            'end_date': str(date.today() + timedelta(days=30)),
            'manager': self.manager.id,
            'assigned_employees': [self.employee1.id],
        })
        project = Project.objects.get(name='Detail Test')
        project_id = project.id

        self.client.force_authenticate(self.employee1)
        res = self.client.get(f'/api/projects/{project_id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class NotificationAPITests(TestCase):
    """Tests for notification CRUD and status endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='testuser@test.com', password='Test@1234',
            first_name='Test', last_name='User', role='employee',
        )
        Notification.objects.create(
            recipient=self.user, type='system',
            title='Welcome', message='Welcome to PerfTrack!',
        )
        Notification.objects.create(
            recipient=self.user, type='project',
            title='New Assignment', message='You have been assigned a project.',
        )

    def test_notification_list(self):
        self.client.force_authenticate(self.user)
        res = self.client.get('/api/notifications/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data.get('results', res.data)
        self.assertEqual(len(data), 2)

    def test_unread_count(self):
        self.client.force_authenticate(self.user)
        res = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['unread_count'], 2)

    def test_mark_read(self):
        self.client.force_authenticate(self.user)
        notif = Notification.objects.filter(recipient=self.user).first()
        res = self.client.post(f'/api/notifications/{notif.id}/read/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Verify unread count decreased
        res = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(res.data['unread_count'], 1)

    def test_mark_all_read(self):
        self.client.force_authenticate(self.user)
        res = self.client.post('/api/notifications/read-all/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Verify all read
        res = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(res.data['unread_count'], 0)

    def test_notifications_not_accessible_unauthenticated(self):
        res = self.client.get('/api/notifications/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
