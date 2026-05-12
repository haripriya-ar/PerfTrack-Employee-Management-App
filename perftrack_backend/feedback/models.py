from django.db import models
from accounts.models import User


class PeerFeedback(models.Model):
    reviewer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='given_feedback'
    )
    reviewee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='received_feedback'
    )
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comments = models.TextField()
    strengths = models.TextField(blank=True)
    improvements = models.TextField(blank=True)
    is_anonymous = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'peer_feedback'
        unique_together = ('reviewer', 'reviewee')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.reviewer.full_name} → {self.reviewee.full_name} ({self.rating}★)'
