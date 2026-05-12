from django.db import models
from accounts.models import User


class Employee(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('on_leave', 'On Leave'),
        ('terminated', 'Terminated'),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='employee_profile'
    )
    employee_id = models.CharField(max_length=20, unique=True)
    designation = models.CharField(max_length=100)
    date_of_joining = models.DateField()
    salary = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='active'
    )
    promotion_eligible = models.BooleanField(default=False)
    bonus_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )

    class Meta:
        db_table = 'employee_profiles'
        ordering = ['user__first_name']

    def __str__(self):
        return f'{self.user.full_name} ({self.employee_id})'
