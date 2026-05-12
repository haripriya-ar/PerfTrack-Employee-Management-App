from rest_framework import serializers
from .models import PerformanceRecord, EvaluationPeriod, Goal
from accounts.serializers import UserMinimalSerializer


class EvaluationPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationPeriod
        fields = ['id', 'name', 'start_date', 'end_date', 'is_active']


class PerformanceRecordSerializer(serializers.ModelSerializer):
    employee_detail = UserMinimalSerializer(source='employee', read_only=True)
    period_detail = EvaluationPeriodSerializer(source='period', read_only=True)
    evaluated_by_detail = UserMinimalSerializer(source='evaluated_by', read_only=True)
    composite_score = serializers.FloatField(read_only=True)
    approved_by_detail = UserMinimalSerializer(source='approved_by', read_only=True)

    class Meta:
        model = PerformanceRecord
        fields = [
            'id', 'employee', 'employee_detail',
            'period', 'period_detail',
            'evaluated_by', 'evaluated_by_detail',
            'task_completion', 'productivity', 'attendance', 'rating',
            'predicted_score', 'composite_score',
            'status', 'hr_comments', 'approved_by', 'approved_by_detail', 'approved_at',
            'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['predicted_score', 'created_at', 'updated_at']


class PerformanceRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceRecord
        fields = [
            'employee', 'period', 'task_completion',
            'productivity', 'attendance', 'rating', 'notes',
        ]

    def create(self, validated_data):
        from .ml_model import engine
        engine.train()
        result = engine.predict(
            task_completion=validated_data['task_completion'],
            productivity=validated_data['productivity'],
            attendance=validated_data['attendance'],
            rating=validated_data['rating'],
        )
        validated_data['predicted_score'] = result['score']
        validated_data['evaluated_by'] = self.context['request'].user
        validated_data['status'] = 'submitted'
        record = PerformanceRecord.objects.create(**validated_data)
        engine.invalidate()
        # Create notifications
        try:
            from notifications.models import Notification
            from accounts.models import User
            Notification.objects.create(
                recipient=record.employee,
                type='performance',
                title='Performance Evaluation Submitted',
                message=f'Your performance for {record.period.name} has been evaluated by {record.evaluated_by.full_name}.',
            )
            # Notify admins for HR review
            for admin in User.objects.filter(role='admin', is_active=True):
                Notification.objects.create(
                    recipient=admin,
                    type='hr',
                    title='Evaluation Pending Review',
                    message=f'{record.employee.full_name} was evaluated by {record.evaluated_by.full_name} for {record.period.name}.',
                )
        except Exception:
            pass
        return record

    def update(self, instance, validated_data):
        from .ml_model import engine
        engine.train()
        result = engine.predict(
            task_completion=validated_data.get('task_completion', instance.task_completion),
            productivity=validated_data.get('productivity', instance.productivity),
            attendance=validated_data.get('attendance', instance.attendance),
            rating=validated_data.get('rating', instance.rating),
        )
        validated_data['predicted_score'] = result['score']
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        engine.invalidate()
        return instance


class GoalSerializer(serializers.ModelSerializer):
    employee_detail = UserMinimalSerializer(source='employee', read_only=True)
    progress_pct = serializers.FloatField(read_only=True)

    class Meta:
        model = Goal
        fields = [
            'id', 'employee', 'employee_detail', 'title', 'description',
            'target_value', 'current_value', 'progress_pct',
            'status', 'due_date', 'created_at',
        ]
        read_only_fields = ['created_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)