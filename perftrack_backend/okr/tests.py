from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, Department
from okr.models import Objective, KeyResult
from datetime import date, timedelta


class OKRAPITests(TestCase):
    """Tests for OKR module APIs."""

    def setUp(self):
        self.client = APIClient()
        self.dept = Department.objects.create(name='Engineering')

        self.admin = User.objects.create_user(
            email='admin@test.com', password='Test@1234',
            first_name='Admin', last_name='User', role='admin'
        )
        self.manager = User.objects.create_user(
            email='manager@test.com', password='Test@1234',
            first_name='Manager', last_name='User', role='manager',
            department=self.dept,
        )
        self.employee = User.objects.create_user(
            email='employee@test.com', password='Test@1234',
            first_name='Employee', last_name='User', role='employee',
            department=self.dept, manager=self.manager,
        )

        self.obj = Objective.objects.create(
            title='Test OKR',
            description='Test objective',
            owner=self.employee,
            department='Engineering',
            start_date=date.today() - timedelta(days=30),
            end_date=date.today() + timedelta(days=60),
            progress=45.0,
        )

        self.kr = KeyResult.objects.create(
            objective=self.obj,
            title='Key Result 1',
            target_value=100,
            current_value=45,
            unit='%',
        )

    def test_objective_list_as_admin(self):
        self.client.force_authenticate(self.admin)
        res = self.client.get('/api/okr/objectives/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_objective_list_as_employee(self):
        self.client.force_authenticate(self.employee)
        res = self.client.get('/api/okr/objectives/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Employee should see their own objectives
        data = res.data.get('results', res.data)
        ids = [o['id'] for o in data]
        self.assertIn(self.obj.id, ids)

    def test_objective_list_as_manager(self):
        self.client.force_authenticate(self.manager)
        res = self.client.get('/api/okr/objectives/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Manager should see team member's objectives
        data = res.data.get('results', res.data)
        ids = [o['id'] for o in data]
        self.assertIn(self.obj.id, ids)

    def test_create_objective_as_manager(self):
        self.client.force_authenticate(self.manager)
        res = self.client.post('/api/okr/objectives/', {
            'title': 'New Objective',
            'owner': self.employee.id,
            'start_date': str(date.today()),
            'end_date': str(date.today() + timedelta(days=90)),
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_okr_summary(self):
        self.client.force_authenticate(self.admin)
        res = self.client.get('/api/okr/summary/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('total_objectives', res.data)
        self.assertIn('avg_progress', res.data)
        self.assertIn('completed', res.data)
        self.assertIn('at_risk', res.data)
        self.assertGreaterEqual(res.data['total_objectives'], 1)

    def test_key_result_auto_progress(self):
        """Key result progress should auto-calculate and update parent objective."""
        self.kr.current_value = 100
        self.kr.save()
        self.kr.refresh_from_db()
        self.assertEqual(self.kr.progress_percentage, 100.0)
        self.obj.refresh_from_db()
        self.assertEqual(self.obj.progress, 100.0)

    def test_objective_detail_permissions(self):
        """Unauthenticated users should not access OKRs."""
        res = self.client.get(f'/api/okr/objectives/{self.obj.id}/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_serializer_includes_key_results(self):
        self.client.force_authenticate(self.employee)
        res = self.client.get(f'/api/okr/objectives/{self.obj.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('key_results', res.data)
        self.assertEqual(len(res.data['key_results']), 1)

    def test_serializer_includes_owner_detail(self):
        self.client.force_authenticate(self.employee)
        res = self.client.get(f'/api/okr/objectives/{self.obj.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('owner_detail', res.data)
        self.assertEqual(res.data['owner_detail']['full_name'], 'Employee User')
