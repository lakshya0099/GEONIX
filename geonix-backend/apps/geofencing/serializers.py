from rest_framework import serializers
from .models import Geofence, LocationUpdate


class GeofenceSerializer(serializers.ModelSerializer):
    """Serializer for Geofence model with organization info."""
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = Geofence
        fields = [
            'id',
            'name',
            'description',
            'latitude',
            'longitude',
            'radius_meters',
            'organization',
            'organization_name',
            'is_active',
            'created_by',
            'created_by_email',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'organization', 'created_by']


class LocationUpdateSerializer(serializers.ModelSerializer):
    """Serializer for LocationUpdate model."""
    user_email = serializers.CharField(source='user.email', read_only=True)
    geofence_name = serializers.CharField(source='geofence.name', read_only=True, allow_null=True)
    
    class Meta:
        model = LocationUpdate
        fields = [
            'id',
            'latitude',
            'longitude',
            'accuracy',
            'is_inside_geofence',
            'geofence',
            'geofence_name',
            'user',
            'user_email',
            'timestamp',
        ]
        read_only_fields = ['id', 'is_inside_geofence', 'geofence', 'user', 'timestamp']


class LocationUpdateCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating LocationUpdate with automatic geofence detection."""
    
    class Meta:
        model = LocationUpdate
        fields = ['latitude', 'longitude', 'accuracy']
    
    def to_representation(self, instance):
        """Return full LocationUpdate serialization after creation."""
        return LocationUpdateSerializer(instance, context=self.context).data
    
    def create(self, validated_data):
        """Create location and detect geofence automatically."""
        from .utils import is_point_inside_geofence
        
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("User must be authenticated")
        
        user = request.user
        latitude = validated_data['latitude']
        longitude = validated_data['longitude']
        accuracy = validated_data.get('accuracy')
        
        # Find which geofence (if any) the user is in
        detected_geofence = None
        organization = user.organization
        
        if organization:
            geofences = organization.geofences.filter(is_active=True)
            for geofence in geofences:
                if is_point_inside_geofence(
                    latitude, 
                    longitude, 
                    geofence.latitude, 
                    geofence.longitude, 
                    geofence.radius_meters
                ):
                    detected_geofence = geofence
                    break
        
        location_update = LocationUpdate.objects.create(
            user=user,
            latitude=latitude,
            longitude=longitude,
            accuracy=accuracy,
            geofence=detected_geofence,
            is_inside_geofence=detected_geofence is not None,
        )
        
        return location_update

