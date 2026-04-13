"""
Geofencing utility functions for location calculations.
"""
import math
from decimal import Decimal
from typing import Tuple


EARTH_RADIUS_METERS = 6371000


def haversine_distance(lat1: Decimal, lon1: Decimal, lat2: Decimal, lon2: Decimal) -> float:
    """
    Calculate the great-circle distance between two points on Earth.
    
    Uses the Haversine formula for accurate distance calculation.
    
    Args:
        lat1, lon1: First point coordinates (in decimal degrees)
        lat2, lon2: Second point coordinates (in decimal degrees)
    
    Returns:
        Distance in meters
    """
    # Convert to float and then to radians
    lat1_rad = math.radians(float(lat1))
    lon1_rad = math.radians(float(lon1))
    lat2_rad = math.radians(float(lat2))
    lon2_rad = math.radians(float(lon2))
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return EARTH_RADIUS_METERS * c


def is_point_inside_geofence(
    point_lat: Decimal, 
    point_lon: Decimal, 
    geofence_lat: Decimal, 
    geofence_lon: Decimal, 
    radius_meters: int
) -> bool:
    """
    Check if a point is inside a circular geofence.
    
    Args:
        point_lat, point_lon: Point coordinates to check
        geofence_lat, geofence_lon: Geofence center coordinates
        radius_meters: Geofence radius in meters
    
    Returns:
        True if point is inside geofence, False otherwise
    """
    distance = haversine_distance(point_lat, point_lon, geofence_lat, geofence_lon)
    return distance <= radius_meters
