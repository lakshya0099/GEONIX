// Geofencing types
export interface Geofence {
  id: string;
  organization: string;
  name: string;
  description: string;
  latitude: string; // Decimal format
  longitude: string;
  radius_meters: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LocationUpdate {
  id: string;
  user: string;
  latitude: string;
  longitude: string;
  accuracy: number;
  is_inside_geofence: boolean;
  geofence: Geofence | null;
  timestamp: string;
  created_at: string;
}

export interface GeofencingState {
  geofences: Geofence[];
  locations: LocationUpdate[];
  currentLocation: LocationUpdate | null;
  isLoading: boolean;
  error: string | null;
}
