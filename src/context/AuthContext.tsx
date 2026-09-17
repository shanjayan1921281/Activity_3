import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Student, Company, Role } from '../types';
import { authService } from '../services/authService';
import { getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  student: Student | null;
  company: Company | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: Role | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  quickLogin: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    const existingToken = getAuthToken();
    if (!existingToken) {
      setUser(null);
      setStudent(null);
      setCompany(null);
      setIsLoading(false);
      return;
    }

    try {
      const meData = await authService.getMe();
      setUser(meData.user);
      setStudent(meData.student || null);
      setCompany(meData.company || null);
      setToken(existingToken);
    } catch (err) {
      console.warn('Session expired or invalid, logging out:', err);
      await authService.logout();
      setUser(null);
      setStudent(null);
      setCompany(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (credentials: { username: string; password: string }) => {
    setIsLoading(true);
    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      setStudent(data.student || null);
      setCompany(data.company || null);
      setToken(data.token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setStudent(null);
      setCompany(null);
      setToken(null);
      setIsLoading(false);
    }
  };

  const quickLogin = async (targetRole: Role) => {
    const credentialsMap: Record<Role, { username: string; password: string }> = {
      admin: { username: 'admin', password: 'admin123' },
      student: { username: 'student', password: 'student123' },
      recruiter: { username: 'recruiter', password: 'recruiter123' },
    };
    await login(credentialsMap[targetRole]);
  };

  const value: AuthContextType = {
    user,
    student,
    company,
    token,
    isAuthenticated: !!user,
    isLoading,
    role: user?.role || null,
    login,
    logout,
    refreshMe: fetchCurrentUser,
    quickLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
