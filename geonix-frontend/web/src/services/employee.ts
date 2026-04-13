// src/services/employee.ts
import { apiClient } from './api';

/* ─── types ───────────────────────────────────────────────────────── */

export interface Employee {
  id: number;
  full_name: string;
  email: string;
  role: 'employee' | 'orgadmin' | 'superadmin';
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  organisation: number;
}

export interface EmployeeAttendanceSummary {
  employee_id: number;
  full_name: string;
  email: string;
  present_days: number;
  absent_days: number;
  late_days: number;
  total_hours: number;
  last_seen: string | null;
  is_present_today: boolean;
  today_clock_in: string | null;
  today_clock_out: string | null;
}

export interface CreateEmployeePayload {
  full_name: string;
  email: string;
  password: string;
  role: 'employee' | 'orgadmin';
}

export interface UpdateEmployeePayload {
  full_name?: string;
  email?: string;
  role?: 'employee' | 'orgadmin';
  is_active?: boolean;
}

/* ─── service ─────────────────────────────────────────────────────── */

export const employeeService = {

  /** GET /api/v1/users/ */
  async getEmployees(): Promise<Employee[]> {
    const response = await apiClient.getClient().get('/accounts/users/');
    return response.data.results ?? response.data;
  },

  /** GET /api/v1/users/{id}/ */
  async getEmployee(id: number): Promise<Employee> {
    const response = await apiClient.getClient().get(`/accounts/users/${id}/`);
    return response.data;
  },

  /** POST /api/v1/users/ */
  async createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
    const response = await apiClient.getClient().post('/accounts/users/', payload);
    return response.data;
  },

  /** PATCH /api/v1/users/{id}/ */
  async updateEmployee(id: number, payload: UpdateEmployeePayload): Promise<Employee> {
    const response = await apiClient.getClient().patch(`/accounts/users/${id}/`, payload);
    return response.data;
  },

  /** DELETE /api/v1/users/{id}/ */
  async deleteEmployee(id: number): Promise<void> {
    await apiClient.getClient().delete(`/accounts/users/${id}/`);
  },

  /** GET /api/v1/attendance/summary/?date_from=X&date_to=Y */
  async getAttendanceSummaries(params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<EmployeeAttendanceSummary[]> {
    const response = await apiClient.getClient().get('/attendance/records/summary/', { params });
    return response.data.results ?? response.data;
  },
};