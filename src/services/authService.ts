import { api, setAuthToken, removeAuthToken } from './api';
import { User, Student, Company } from '../types';

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
  student?: Student | null;
  company?: Company | null;
}

export interface MeResponse {
  user: User;
  student?: Student | null;
  company?: Company | null;
}

export const authService = {
  login: async (credentials: { username: string; password: string }): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/auth/login', credentials);
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      removeAuthToken();
    }
  },

  getMe: async (): Promise<MeResponse> => {
    return api.get<MeResponse>('/auth/me');
  },
};
