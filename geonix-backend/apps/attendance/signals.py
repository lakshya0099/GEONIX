"""
Django signals for automatic attendance events based on geofencing.

Automatically creates clock-in records when employees enter geofences.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from apps.geofencing.models import LocationUpdate
from .models import AttendanceRecord, CheckInEvent


@receiver(post_save, sender=LocationUpdate)
def auto_clock_in_on_geofence_entry(sender, instance, created, **kwargs):
    """
    Automatically clock in an employee when they enter an active geofence.
    
    This signal handler:
    1. Triggers when a new LocationUpdate is created
    2. Checks if the location is inside a geofence
    3. Creates/updates today's AttendanceRecord
    4. Sets clock_in_time if not already set
    5. Logs the auto check-in event
    
    Args:
        sender: LocationUpdate model
        instance: The LocationUpdate instance
        created: Boolean, True if this is a new record
        **kwargs: Additional arguments
    """
    # Only process newly created locations
    if not created:
        return
    
    # Only process locations inside geofences
    if not instance.is_inside_geofence or not instance.geofence:
        return
    
    user = instance.user
    
    # User must belong to an organization
    if not user.organization:
        return
    
    # Get the date from the location timestamp
    location_date = instance.timestamp.date()
    
    # Get or create today's attendance record
    record, created_record = AttendanceRecord.objects.get_or_create(
        user=user,
        date=location_date,
        defaults={
            'organization': user.organization,
            'status': 'pending'
        }
    )
    
    # Only auto clock-in if not already checked in
    if not record.clock_in_time:
        # Update record with check-in time
        record.clock_in_time = instance.timestamp
        record.status = 'checked_in'
        record.is_present = True
        
        # Calculate if employee is late (with error handling)
        try:
            record.check_if_late()
        except Exception:
            # If attendance settings don't exist, skip late detection
            pass
        
        # Save the updated record
        record.save()
        
        # Log the auto check-in event
        CheckInEvent.objects.create(
            user=user,
            attendance_record=record,
            is_check_in=True,
            event_type='auto_geofence',
            geofence=instance.geofence,
            notes=f'Auto check-in: Entered {instance.geofence.name} geofence'
        )


@receiver(post_save, sender=LocationUpdate)
def track_geofence_exit(sender, instance, created, **kwargs):
    """
    Track when employees exit geofences (optional notification/logging).
    
    This could be used for:
    - Sending alerts if employee exits during work hours
    - Auto checkout (currently disabled in config)
    - Geofence violation tracking
    
    Current implementation: Just logs exit events for audit trail
    Future: Could implement auto checkout based on org settings
    
    Args:
        sender: LocationUpdate model
        instance: The LocationUpdate instance
        created: Boolean, True if this is a new record
        **kwargs: Additional arguments
    """
    if not created:
        return
    
    # Only process locations OUTSIDE geofences
    if instance.is_inside_geofence:
        return
    
    user = instance.user
    if not user.organization:
        return
    
    location_date = instance.timestamp.date()
    
    # Get today's attendance record if exists
    try:
        record = AttendanceRecord.objects.get(user=user, date=location_date)
    except AttendanceRecord.DoesNotExist:
        return
    
    # Only process if employee is currently checked in but not checked out
    if record.clock_in_time and not record.clock_out_time:
        # For now, just log the event for audit trail
        # Auto checkout is disabled in organization settings
        
        CheckInEvent.objects.create(
            user=user,
            attendance_record=record,
            is_check_in=False,
            event_type='auto_exit',
            geofence=None,  # They exited, so no geofence
            notes='Location update: Employee exited all geofences'
        )
