import { api } from './api';
import { PlacementDrive, EligibilityResult } from '../types';

export interface DriveFilterParams {
  search?: string;
  status?: string;
  department?: string;
  company_id?: number | string;
}

export const driveService = {
  getAll: async (params?: DriveFilterParams): Promise<{ count: number; results: PlacementDrive[] }> => {
    return api.get<{ count: number; results: PlacementDrive[] }>('/drives', params);
  },

  getById: async (id: number): Promise<PlacementDrive> => {
    return api.get<PlacementDrive>(`/drives/${id}`);
  },

  create: async (data: Partial<PlacementDrive>): Promise<{ message: string; drive: PlacementDrive }> => {
    return api.post<{ message: string; drive: PlacementDrive }>('/drives', data);
  },

  update: async (id: number, data: Partial<PlacementDrive>): Promise<{ message: string; drive: PlacementDrive }> => {
    return api.put<{ message: string; drive: PlacementDrive }>(`/drives/${id}`, data);
  },

  delete: async (id: number): Promise<{ message: string }> => {
    return api.delete<{ message: string }>(`/drives/${id}`);
  },

  checkEligibility: async (driveId: number, studentId?: number): Promise<EligibilityResult> => {
    const params = studentId ? { student_id: studentId } : undefined;
    return api.get<EligibilityResult>(`/drives/${driveId}/eligibility`, params);
  },
};
