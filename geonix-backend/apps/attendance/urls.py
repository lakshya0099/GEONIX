from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AttendanceRecordViewSet,
    AttendanceSettingsViewSet,
    CheckInEventViewSet,
    attendance_settings_patch,
)

router = DefaultRouter()
router.register(r'records', AttendanceRecordViewSet, basename='attendance-record')
router.register(r'settings', AttendanceSettingsViewSet, basename='attendance-settings')
router.register(r'events', CheckInEventViewSet, basename='check-in-event')

urlpatterns = [
    path('settings/', attendance_settings_patch, name='attendance-settings-patch'),
    path('', include(router.urls)),
]
