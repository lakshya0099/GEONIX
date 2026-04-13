import { apiClient } from './api';
import { AttendanceRecord, AttendanceSettings, CheckInEvent } from '../types/attendance';

export const attendanceService = {
  // Attendance Records
  async getAttendanceRecords(
    dateFrom?: string,
    dateTo?: string,
    userId?: string,
    status?: string
  ): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (userId) params.append('user', userId);
    if (status) params.append('status', status);

    const response = await apiClient.getClient().get(
      `/attendance/records/?${params.toString()}`
    );
    return response.data.results || response.data;
  },

  async getTodayStatus(): Promise<AttendanceRecord> {
    const response = await apiClient.getClient().get('/attendance/records/today_status/');
    return response.data;
  },

  async getMyRecords(limit: number = 30): Promise<AttendanceRecord[]> {
    const response = await apiClient.getClient().get(
      `/attendance/records/my_records/?limit=${limit}`
    );
    return response.data.results || response.data;
  },

  async getDailyReport(date: string): Promise<any> {
    const response = await apiClient.getClient().get(
      `/attendance/records/daily_summary/?date=${date}`
    );
    return response.data;
  },

  async getWeeklyReport(startDate: string): Promise<any> {
    const response = await apiClient.getClient().get(
      `/attendance/records/weekly_summary/?start_date=${startDate}`
    );
    return response.data;
  },

  async getMonthlyReport(year: number, month: number): Promise<any> {
    const response = await apiClient.getClient().get(
      `/attendance/records/monthly_summary/?year=${year}&month=${month}`
    );
    return response.data;
  },

  // Manual Check-in/Check-out
  async manualCheckIn(date: string, time: string): Promise<AttendanceRecord> {
    const response = await apiClient.getClient().post('/attendance/records/check_in/', {
      date,
      time,
    });
    return response.data;
  },

  async manualCheckOut(date: string, time: string): Promise<AttendanceRecord> {
    const response = await apiClient.getClient().post('/attendance/records/check_out/', {
      date,
      time,
    });
    return response.data;
  },

  // Settings
  async getSettings(): Promise<AttendanceSettings> {
    const response = await apiClient.getClient().get('/attendance/settings/');
    return response.data;
  },

  async updateSettings(settings: Partial<AttendanceSettings>): Promise<AttendanceSettings> {
    const response = await apiClient.getClient().patch('/attendance/settings/', settings);
    return response.data;
  },

  // Check-in Events
  async getCheckInEvents(attendanceRecordId: string): Promise<CheckInEvent[]> {
    const response = await apiClient.getClient().get(
      `/attendance/records/${attendanceRecordId}/events/`
    );
    return response.data;
  },
};
