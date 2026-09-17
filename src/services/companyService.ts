import { api } from './api';
import { Company } from '../types';

export interface CompanyFilterParams {
  search?: string;
  industry?: string;
  location?: string;
}

export const companyService = {
  getAll: async (params?: CompanyFilterParams): Promise<{ count: number; results: Company[] }> => {
    return api.get<{ count: number; results: Company[] }>('/companies', params);
  },

  getById: async (id: number): Promise<Company> => {
    return api.get<Company>(`/companies/${id}`);
  },

  create: async (data: Partial<Company>): Promise<{ message: string; company: Company }> => {
    return api.post<{ message: string; company: Company }>('/companies', data);
  },

  update: async (id: number, data: Partial<Company>): Promise<{ message: string; company: Company }> => {
    return api.put<{ message: string; company: Company }>(`/companies/${id}`, data);
  },

  delete: async (id: number): Promise<{ message: string }> => {
    return api.delete<{ message: string }>(`/companies/${id}`);
  },
};
