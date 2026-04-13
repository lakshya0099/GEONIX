from django.contrib import admin
from .models import Geofence, LocationUpdate


@admin.register(Geofence)
class GeofenceAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization', 'latitude', 'longitude', 'radius_meters', 'is_active', 'created_at')
    list_filter = ('is_active', 'organization', 'created_at')
    search_fields = ('name', 'organization__name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'description', 'organization')
        }),
        ('Location', {
            'fields': ('latitude', 'longitude', 'radius_meters')
        }),
        ('Status', {
            'fields': ('is_active', 'created_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(LocationUpdate)
class LocationUpdateAdmin(admin.ModelAdmin):
    list_display = ('user', 'latitude', 'longitude', 'is_inside_geofence', 'geofence', 'timestamp')
    list_filter = ('is_inside_geofence', 'geofence', 'timestamp')
    search_fields = ('user__email', 'user__full_name')
    readonly_fields = ('id', 'timestamp')
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
