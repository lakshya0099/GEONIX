from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import uuid
from datetime import time, datetime, timedelta


class AttendanceSettings(models.Model):
    """Organization-level attendance configuration."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.OneToOneField(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='attendance_settings'
    )
    
    # Working hours
    working_hours_start = models.TimeField(default=time(9, 0))
    working_hours_end = models.TimeField(default=time(18, 0))
    
    # Late marking threshold (in minutes)
    late_threshold_minutes = models.IntegerField(
        default=30,
        validators=[MinValueValidator(0), MaxValueValidator(180)]
    )
    
    # Auto checkout
    auto_checkout_enabled = models.BooleanField(default=False)
    auto_checkout_minutes = models.IntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(60)]
    )
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Attendance Settings'
    
    def __str__(self):
        return f"Settings - {self.organization.name}"


class AttendanceRecord(models.Model):
    """Daily attendance record for an employee."""
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('absent', 'Absent'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    
    # Date for the record
    date = models.DateField(default=timezone.now)
    
    # Clock times
    clock_in_time = models.DateTimeField(null=True, blank=True)
    clock_out_time = models.DateTimeField(null=True, blank=True)
    
    # Status and flags
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    is_present = models.BooleanField(default=False)
    is_late = models.BooleanField(default=False)
    
    # Hours worked
    total_hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.0'))]
    )
    
    # Notes
    notes = models.TextField(blank=True, null=True)
    
    # Track creation
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']
        indexes = [
            models.Index(fields=['user', '-date']),
            models.Index(fields=['organization', '-date']),
            models.Index(fields=['is_late']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.date}"
    
    def calculate_total_hours(self):
        """Calculate total hours worked based on clock times."""
        if self.clock_in_time and self.clock_out_time:
            delta = self.clock_out_time - self.clock_in_time
            hours = Decimal(str(delta.total_seconds() / 3600))
            self.total_hours = hours.quantize(Decimal('0.01'))
            return self.total_hours
        return None
    
    def check_if_late(self):
        """Check if employee is late based on organization settings."""
        if not self.clock_in_time:
            return False
        
        settings = self.organization.attendance_settings
        late_threshold = timedelta(minutes=settings.late_threshold_minutes)
        
        # Get expected start time for this date
        expected_start = datetime.combine(
            self.date,
            settings.working_hours_start,
            tzinfo=self.clock_in_time.tzinfo
        )
        
        # Check if clock-in is after threshold
        self.is_late = self.clock_in_time > (expected_start + late_threshold)
        return self.is_late


class CheckInEvent(models.Model):
    """Track individual check-in and check-out events."""
    
    EVENT_TYPE_CHOICES = (
        ('manual', 'Manual'),
        ('auto_geofence', 'Auto Geofence Entry'),
        ('auto_exit', 'Auto Geofence Exit'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='check_in_events'
    )
    attendance_record = models.ForeignKey(
        'AttendanceRecord',
        on_delete=models.CASCADE,
        related_name='check_in_events'
    )
    
    # Event details
    event_type = models.CharField(
        max_length=20,
        choices=EVENT_TYPE_CHOICES,
        default='manual'
    )
    is_check_in = models.BooleanField(default=True)
    
    # Location where event occurred
    geofence = models.ForeignKey(
        'geofencing.Geofence',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='check_in_events'
    )
    
    # Timestamp
    timestamp = models.DateTimeField(default=timezone.now)
    
    # Notes
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['attendance_record']),
        ]
    
    def __str__(self):
        event_label = 'Check-In' if self.is_check_in else 'Check-Out'
        return f"{self.user.email} - {event_label} ({self.timestamp})"

