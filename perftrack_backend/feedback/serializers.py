from rest_framework import serializers
from .models import PeerFeedback
from accounts.serializers import UserMinimalSerializer


class PeerFeedbackSerializer(serializers.ModelSerializer):
    reviewer_detail = UserMinimalSerializer(source='reviewer', read_only=True)
    reviewee_detail = UserMinimalSerializer(source='reviewee', read_only=True)

    class Meta:
        model = PeerFeedback
        fields = [
            'id', 'reviewer', 'reviewer_detail',
            'reviewee', 'reviewee_detail',
            'rating', 'comments', 'strengths', 'improvements',
            'is_anonymous', 'created_at',
        ]
        read_only_fields = ['reviewer', 'created_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Hide reviewer identity if anonymous
        if instance.is_anonymous:
            request = self.context.get('request')
            if request and request.user != instance.reviewer and request.user.role != 'admin':
                data['reviewer'] = None
                data['reviewer_detail'] = {
                    'id': None, 'full_name': 'Anonymous',
                    'email': '', 'role': '', 'avatar_initials': '??',
                    'department_name': '',
                }
        return data
