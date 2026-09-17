import { api } from './api';
import { Student, PaginatedResponse } from '../types';

export interface StudentFilterParams {
  search?: string;
  department?: string;
  year?: string | number;
  placement_status?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  page_size?: number;
}

export const studentService = {
  getAll: async (params?: StudentFilterParams): Promise<PaginatedResponse<Student>> => {
    return api.get<PaginatedResponse<Student>>('/students', params);
  },

  getById: async (id: number): Promise<Student> => {
    return api.get<Student>(`/students/${id}`);
  },

  create: async (data: Partial<Student>): Promise<{ message: string; student: Student }> => {
    return api.post<{ message: string; student: Student }>('/students', data);
  },

  update: async (id: number, data: Partial<Student>): Promise<{ message: string; student: Student }> => {
    return api.put<{ message: string; student: Student }>(`/students/${id}`, data);
  },

  delete: async (id: number): Promise<{ message: string }> => {
    return api.delete<{ message: string }>(`/students/${id}`);
  },
};
