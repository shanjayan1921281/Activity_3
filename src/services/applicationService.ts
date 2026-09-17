import { api } from './api';
import { Application, ApplicationStatus, DashboardStats } from '../types';

export interface ApplicationFilterParams {
  student_id?: number | string;
  placement_drive_id?: number | string;
  company_id?: number | string;
  status?: string;
  search?: string;
}

export const applicationService = {
  getAll: async (params?: ApplicationFilterParams): Promise<{ count: number; results: Application[] }> => {
    return api.get<{ count: number; results: Application[] }>('/applications', params);
  },

  getById: async (id: number): Promise<Application> => {
    return api.get<Application>(`/applications/${id}`);
  },

  apply: async (data: { student_id?: number; placement_drive_id: number; remarks?: string }): Promise<{ message: string; application: Application }> => {
    return api.post<{ message: string; application: Application }>('/applications', data);
  },

  updateStatus: async (
    id: number,
    data: { status: ApplicationStatus; remarks?: string }
  ): Promise<{ message: string; application: Application }> => {
    return api.put<{ message: string; application: Application }>(`/applications/${id}`, data);
  },

  withdraw: async (id: number): Promise<{ message: string }> => {
    return api.delete<{ message: string }>(`/applications/${id}`);
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    return api.get<DashboardStats>('/dashboard/stats');
  },

  resetDemoData: async (): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/system/reset-demo-data');
  },
};
