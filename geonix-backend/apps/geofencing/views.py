from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import Geofence, LocationUpdate
from .serializers import (
    GeofenceSerializer,
    LocationUpdateSerializer,
    LocationUpdateCreateSerializer,
)
from .permissions import IsOrgAdminOrReadOnly, IsEmployeeInSameOrg


class GeofenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing geofences.
    
    Org admins can create/update/delete geofences.
    Employees can list and view geofences for their organization.
    """
    serializer_class = GeofenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return geofences for user's organization."""
        user = self.request.user
        if not user.organization:
            return Geofence.objects.none()
        
        return Geofence.objects.filter(
            organization=user.organization
        ).select_related('created_by', 'organization')
    
    def check_permissions(self, request):
        """Check if user has permission for this action."""
        super().check_permissions(request)
        
        # Only org admins can create/update/delete
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            if request.user.role != 'orgadmin':
                self.permission_denied(request, "Only organization admins can manage geofences.")
    
    def perform_create(self, serializer):
        """Set organization and created_by on geofence creation."""
        serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user
        )


class LocationUpdateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing location updates.
    
    Employees can submit their current location.
    Users can view location history for their own organization.
    """
    permission_classes = [IsAuthenticated, IsEmployeeInSameOrg]
    
    def get_serializer_class(self):
        """Use different serializer for create vs list/retrieve."""
        if self.action == 'create':
            return LocationUpdateCreateSerializer
        return LocationUpdateSerializer
    
    def get_queryset(self):
        """Return locations for user's organization."""
        user = self.request.user
        if not user.organization:
            return LocationUpdate.objects.none()
        
        # Org admins see all locations in their org
        # Employees see only their own locations
        if user.role == 'orgadmin':
            return LocationUpdate.objects.filter(
                user__organization=user.organization
            ).select_related('user', 'geofence')
        else:
            return LocationUpdate.objects.filter(
                user=user
            ).select_related('user', 'geofence')
    
    @action(detail=False, methods=['get'])
    def my_locations(self, request):
        """Get current user's location history."""
        locations = LocationUpdate.objects.filter(
            user=request.user
        ).order_by('-timestamp')[:50]
        
        serializer = self.get_serializer(locations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def current_status(self, request):
        """Get user's current geofence status (latest location)."""
        latest = LocationUpdate.objects.filter(
            user=request.user
        ).order_by('-timestamp').first()
        
        if not latest:
            return Response(
                {'detail': 'No location data available'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(latest)
        return Response(serializer.data)


