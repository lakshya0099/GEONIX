import { apiClient } from './api';
import { Geofence, LocationUpdate } from '../types/geofencing';

export const geofencingService = {
  // Geofences
  async getGeofences(): Promise<Geofence[]> {
    const response = await apiClient.getClient().get('/geofencing/geofences/');
    return response.data.results || response.data;
  },

  async getGeofence(id: string): Promise<Geofence> {
    const response = await apiClient.getClient().get(`/geofencing/geofences/${id}/`);
    return response.data;
  },

  async createGeofence(data: Partial<Geofence>): Promise<Geofence> {
    const response = await apiClient.getClient().post('/geofencing/geofences/', data);
    return response.data;
  },

  async updateGeofence(id: string, data: Partial<Geofence>): Promise<Geofence> {
    const response = await apiClient.getClient().patch(
      `/geofencing/geofences/${id}/`,
      data
    );
    return response.data;
  },

  async deleteGeofence(id: string): Promise<void> {
    await apiClient.getClient().delete(`/geofencing/geofences/${id}/`);
  },

  // Locations
  async submitLocation(latitude: number, longitude: number, accuracy: number): Promise<LocationUpdate> {
    const response = await apiClient.getClient().post('/geofencing/locations/', {
      latitude,
      longitude,
      accuracy,
    });
    return response.data;
  },

  async getLocations(limit: number = 50): Promise<LocationUpdate[]> {
    const response = await apiClient.getClient().get(
      `/geofencing/locations/?limit=${limit}`
    );
    return response.data.results || response.data;
  },

  async getMyLocations(limit: number = 50): Promise<LocationUpdate[]> {
    const response = await apiClient.getClient().get(
      `/geofencing/locations/my_locations/?limit=${limit}`
    );
    return response.data.results || response.data;
  },

  async getCurrentStatus(): Promise<LocationUpdate | null> {
    try {
      const response = await apiClient.getClient().get('/geofencing/locations/current_status/');
      return response.data;
    } catch (error) {
      return null;
    }
  },
};
