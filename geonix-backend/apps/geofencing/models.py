from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
import uuid


class Geofence(models.Model):
    """
    Geographic boundary defined by center coordinates and radius.
    Used to track if employees are within designated work areas.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='geofences'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    # Coordinates in decimal degrees (WGS84)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    
    # Radius in meters
    radius_meters = models.IntegerField(
        default=100,
        validators=[MinValueValidator(10)]
    )
    
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_geofences'
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Geofences'
    
    def __str__(self):
        return f"{self.name} - {self.organization.name}"


class LocationUpdate(models.Model):
    """
    GPS location submitted by an employee.
    Tracks when and where employee locations are recorded.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='location_updates'
    )
    
    # Coordinates in decimal degrees (WGS84)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    
    # GPS accuracy in meters (if provided by mobile device)
    accuracy = models.IntegerField(null=True, blank=True)
    
    # Which geofence the employee is in (if any)
    geofence = models.ForeignKey(
        'Geofence',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='location_updates'
    )
    
    # Is employee inside any geofence?
    is_inside_geofence = models.BooleanField(default=False)
    
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['geofence', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.timestamp}"
