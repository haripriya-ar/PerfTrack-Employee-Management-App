from django.db import models
from accounts.models import User


class Project(models.Model):
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='planning'
    )
    priority = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default='medium'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    progress = models.IntegerField(default=0)  # 0–100
    assigned_employees = models.ManyToManyField(
        User, related_name='assigned_projects', blank=True,
        limit_choices_to={'role': 'employee'}
    )
    manager = models.ForeignKey(
        User, null=True, on_delete=models.SET_NULL,
        related_name='managed_projects',
        limit_choices_to={'role__in': ['manager', 'admin']}
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.status})'
