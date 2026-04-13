from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GeofenceViewSet, LocationUpdateViewSet

router = DefaultRouter()
router.register(r'geofences', GeofenceViewSet, basename='geofence')
router.register(r'locations', LocationUpdateViewSet, basename='location')

urlpatterns = [
    path('', include(router.urls)),
]
