from django.contrib import admin
from .models import PeerFeedback

@admin.register(PeerFeedback)
class PeerFeedbackAdmin(admin.ModelAdmin):
    list_display = ['reviewer', 'reviewee', 'rating', 'is_anonymous', 'created_at']
    list_filter = ['rating', 'is_anonymous', 'created_at']
    search_fields = ['reviewer__first_name', 'reviewee__first_name', 'comments']
