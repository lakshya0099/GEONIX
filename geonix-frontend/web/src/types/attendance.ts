// Attendance types
export interface AttendanceRecord {
  id: string;
  user: string;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  status: 'pending' | 'checked_in' | 'checked_out';
  is_present: boolean;
  is_late: boolean;
  total_hours: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSettings {
  id: string;
  organization: string;
  working_hours_start: string; // HH:MM format
  working_hours_end: string;
  late_threshold_minutes: number;
  auto_checkout_enabled: boolean;
  auto_checkout_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface CheckInEvent {
  id: string;
  user: string;
  attendance_record: string;
  is_check_in: boolean;
  event_type: 'manual' | 'auto_geofence' | 'auto_exit';
  geofence: string | null;
  notes: string;
  timestamp: string;
}

export interface AttendanceState {
  records: AttendanceRecord[];
  todayStatus: AttendanceRecord | null;
  settings: AttendanceSettings | null;
  isLoading: boolean;
  error: string | null;
}
