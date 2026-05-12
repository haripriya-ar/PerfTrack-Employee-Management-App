from django.db import models
from accounts.models import User


class Objective(models.Model):
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='objectives'
    )
    department = models.CharField(max_length=100, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    progress = models.FloatField(default=0.0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'objectives'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.owner.full_name})'


class KeyResult(models.Model):
    objective = models.ForeignKey(
        Objective, on_delete=models.CASCADE, related_name='key_results'
    )
    title = models.CharField(max_length=300)
    target_value = models.FloatField()
    current_value = models.FloatField(default=0.0)
    unit = models.CharField(max_length=50, blank=True)
    progress_percentage = models.FloatField(default=0.0)

    class Meta:
        db_table = 'key_results'

    def __str__(self):
        return f'{self.title} ({self.progress_percentage:.0f}%)'

    def save(self, *args, **kwargs):
        if self.target_value > 0:
            self.progress_percentage = min(
                (self.current_value / self.target_value) * 100, 100
            )
        super().save(*args, **kwargs)
        # Recalculate parent objective progress
        krs = self.objective.key_results.all()
        if krs.exists():
            avg_progress = sum(kr.progress_percentage for kr in krs) / krs.count()
            Objective.objects.filter(pk=self.objective_id).update(progress=avg_progress)
