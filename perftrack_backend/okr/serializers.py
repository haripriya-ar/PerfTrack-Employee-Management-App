from rest_framework import serializers
from .models import Objective, KeyResult
from accounts.serializers import UserMinimalSerializer


class KeyResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = KeyResult
        fields = [
            'id', 'objective', 'title', 'target_value',
            'current_value', 'unit', 'progress_percentage',
        ]
        read_only_fields = ['progress_percentage']


class ObjectiveSerializer(serializers.ModelSerializer):
    owner_detail = UserMinimalSerializer(source='owner', read_only=True)
    key_results = KeyResultSerializer(many=True, read_only=True)

    class Meta:
        model = Objective
        fields = [
            'id', 'title', 'description', 'owner', 'owner_detail',
            'department', 'start_date', 'end_date',
            'progress', 'is_active', 'key_results', 'created_at',
        ]
        read_only_fields = ['progress', 'created_at']


class ObjectiveCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Objective
        fields = [
            'title', 'description', 'owner', 'department',
            'start_date', 'end_date', 'is_active',
        ]
