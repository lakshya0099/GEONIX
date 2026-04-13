from rest_framework import serializers
from datetime import datetime, timedelta
from .models import AttendanceRecord, AttendanceSettings, CheckInEvent


class AttendanceSettingsSerializer(serializers.ModelSerializer):
    """Serializer for organization attendance settings."""
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = AttendanceSettings
        fields = [
            'id',
            'organization',
            'organization_name',
            'working_hours_start',
            'working_hours_end',
            'late_threshold_minutes',
            'auto_checkout_enabled',
            'auto_checkout_minutes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'organization']


class CheckInEventSerializer(serializers.ModelSerializer):
    """Serializer for check-in events."""
    user_email = serializers.CharField(source='user.email', read_only=True)
    geofence_name = serializers.CharField(source='geofence.name', read_only=True, allow_null=True)
    event_label = serializers.SerializerMethodField()
    
    class Meta:
        model = CheckInEvent
        fields = [
            'id',
            'user',
            'user_email',
            'attendance_record',
            'event_type',
            'is_check_in',
            'event_label',
            'geofence',
            'geofence_name',
            'timestamp',
            'notes',
            'created_at',
        ]
        read_only_fields = ['id', 'user', 'timestamp', 'created_at']
    
    def get_event_label(self, obj):
        return 'Check-In' if obj.is_check_in else 'Check-Out'


class AttendanceRecordListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for attendance record listings."""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = AttendanceRecord
        fields = [
            'id',
            'user',
            'user_email',
            'user_name',
            'date',
            'status',
            'is_present',
            'is_late',
            'clock_in_time',
            'clock_out_time',
            'total_hours',
        ]
        read_only_fields = ['id', 'total_hours', 'is_late']


class AttendanceRecordSerializer(serializers.ModelSerializer):
    """Full serializer for attendance records."""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    check_in_events = CheckInEventSerializer(many=True, read_only=True)
    
    class Meta:
        model = AttendanceRecord
        fields = [
            'id',
            'user',
            'user_email',
            'user_name',
            'organization',
            'date',
            'clock_in_time',
            'clock_out_time',
            'status',
            'is_present',
            'is_late',
            'total_hours',
            'notes',
            'check_in_events',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'total_hours', 'is_late', 'created_at', 'updated_at', 'organization']
    
    def create(self, validated_data):
        """Create and calculate hours."""
        record = AttendanceRecord.objects.create(**validated_data)
        record.calculate_total_hours()
        record.check_if_late()
        record.save()
        return record
    
    def update(self, instance, validated_data):
        """Update and recalculate hours."""
        instance = super().update(instance, validated_data)
        instance.calculate_total_hours()
        instance.check_if_late()
        instance.save()
        return instance


class AttendanceRecordCheckInSerializer(serializers.Serializer):
    """Serializer for manual check-in/check-out."""
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def create(self, validated_data):
        """Create check-in event and attendance record."""
        request = self.context.get('request')
        user = request.user
        org = user.organization
        
        if not org:
            raise serializers.ValidationError("User must belong to an organization")
        
        # Get or create today's attendance record
        today = datetime.now().date()
        record, created = AttendanceRecord.objects.get_or_create(
            user=user,
            date=today,
            defaults={'organization': org}
        )
        
        # Create check-in event
        event = CheckInEvent.objects.create(
            user=user,
            attendance_record=record,
            is_check_in=True,
            event_type='manual',
            notes=validated_data.get('notes', '')
        )
        
        # Update record if it's first check-in
        if not record.clock_in_time:
            record.clock_in_time = event.timestamp
            record.status = 'checked_in'
            record.is_present = True
            record.check_if_late()
            record.save()
        
        return record


class AttendanceRecordCheckOutSerializer(serializers.Serializer):
    """Serializer for manual check-out."""
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def create(self, validated_data):
        """Create check-out event and update attendance record."""
        request = self.context.get('request')
        user = request.user
        
        # Get today's attendance record
        today = datetime.now().date()
        try:
            record = AttendanceRecord.objects.get(user=user, date=today)
        except AttendanceRecord.DoesNotExist:
            raise serializers.ValidationError("No active attendance record for today")
        
        if record.clock_out_time:
            raise serializers.ValidationError("Already checked out today")
        
        # Create check-out event
        event = CheckInEvent.objects.create(
            user=user,
            attendance_record=record,
            is_check_in=False,
            event_type='manual',
            notes=validated_data.get('notes', '')
        )
        
        # Update record
        record.clock_out_time = event.timestamp
        record.status = 'checked_out'
        record.calculate_total_hours()
        record.save()
        
        return record
