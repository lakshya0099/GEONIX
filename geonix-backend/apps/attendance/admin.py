from django.contrib import admin
from .models import AttendanceRecord, AttendanceSettings, CheckInEvent


@admin.register(AttendanceSettings)
class AttendanceSettingsAdmin(admin.ModelAdmin):
    list_display = ('organization', 'working_hours_start', 'working_hours_end', 'late_threshold_minutes')
    list_filter = ('created_at',)
    search_fields = ('organization__name',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    fieldsets = (
        ('Organization', {
            'fields': ('organization', 'id')
        }),
        ('Working Hours', {
            'fields': ('working_hours_start', 'working_hours_end')
        }),
        ('Late Marking', {
            'fields': ('late_threshold_minutes',)
        }),
        ('Auto Checkout', {
            'fields': ('auto_checkout_enabled', 'auto_checkout_minutes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'status', 'clock_in_time', 'clock_out_time', 'total_hours', 'is_late')
    list_filter = ('status', 'is_late', 'date', 'organization')
    search_fields = ('user__email', 'user__full_name')
    readonly_fields = ('id', 'total_hours', 'is_late', 'created_at', 'updated_at')
    fieldsets = (
        ('Employee Info', {
            'fields': ('user', 'organization', 'date', 'id')
        }),
        ('Clock Times', {
            'fields': ('clock_in_time', 'clock_out_time')
        }),
        ('Status', {
            'fields': ('status', 'is_present', 'is_late')
        }),
        ('Work Hours', {
            'fields': ('total_hours',)
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """Calculate hours and check late status on save."""
        obj.calculate_total_hours()
        obj.check_if_late()
        super().save_model(request, obj, form, change)


@admin.register(CheckInEvent)
class CheckInEventAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_event_label', 'event_type', 'timestamp', 'geofence')
    list_filter = ('event_type', 'is_check_in', 'timestamp')
    search_fields = ('user__email', 'user__full_name')
    readonly_fields = ('id', 'timestamp', 'created_at')
    
    def get_event_label(self, obj):
        return 'Check-In' if obj.is_check_in else 'Check-Out'
    get_event_label.short_description = 'Event'
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False

