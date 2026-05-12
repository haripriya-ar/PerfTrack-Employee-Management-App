from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from accounts.models import User


class EvaluationPeriod(models.Model):
    name = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='periods_created')

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-start_date']


class PerformanceRecord(models.Model):
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='performance_records',
                                 limit_choices_to={'role': 'employee'})
    period = models.ForeignKey(EvaluationPeriod, on_delete=models.CASCADE, related_name='records')
    evaluated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='evaluations_given')

    task_completion = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    productivity = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    attendance = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    rating = models.FloatField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    predicted_score = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True)

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    hr_comments = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='approvals_given'
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('employee', 'period')
        ordering = ['-period__start_date']

    def __str__(self):
        return f'{self.employee.full_name} — {self.period.name}'

    @property
    def composite_score(self):
        return round(
            self.task_completion * 0.35 +
            self.productivity * 0.30 +
            self.attendance * 0.20 +
            (self.rating * 20) * 0.15, 2
        )


class Goal(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    target_value = models.FloatField()
    current_value = models.FloatField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    due_date = models.DateField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='goals_created')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.employee.full_name}: {self.title}'

    @property
    def progress_pct(self):
        if self.target_value == 0:
            return 0
        return min(round((self.current_value / self.target_value) * 100, 1), 100)

    class Meta:
        ordering = ['due_date']