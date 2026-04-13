from django.apps import AppConfig


class AttendanceConfig(AppConfig):
    name = 'apps.attendance'
    
    def ready(self):
        """Register signals when the app is ready."""
        import apps.attendance.signals  # noqa
