import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GraduationCap, Shield, User, Briefcase, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Role } from '../types';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error } = useToast();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [selectedRole, setSelectedRole] = useState<Role>('admin');
  const [isLoading, setIsLoading] = useState(false);

  const demoAccounts: Record<Role, { username: string; pass: string; label: string; desc: string }> = {
    admin: {
      username: 'admin',
      pass: 'admin123',
      label: 'Placement Officer (Admin)',
      desc: 'Full access to Students, Companies, Drives, and Selection approvals',
    },
    student: {
      username: 'student',
      pass: 'student123',
      label: 'Student Candidate (Aarav Sharma)',
      desc: 'Browse Drives, verify Eligibility criteria, Apply, track Status',
    },
    recruiter: {
      username: 'recruiter',
      pass: 'recruiter123',
      label: 'Google India Recruiter',
      desc: 'Review applicants for Google drives, shortlist candidates',
    },
  };

  const handleRoleSelect = (roleKey: Role) => {
    setSelectedRole(roleKey);
    setUsername(demoAccounts[roleKey].username);
    setPassword(demoAccounts[roleKey].pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      error('Please enter both username and password.', 'Required Fields');
      return;
    }

    setIsLoading(true);
    try {
      await login({ username: username.trim(), password });
      success(`Welcome to College Placement Management System`, 'Login Successful');
      navigate('/dashboard');
    } catch (err: any) {
      error(err.message || 'Invalid username or password.', 'Authentication Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          College Placement Portal
        </h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Centralized Placement Cell & Career Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-slate-200 dark:border-slate-800">
          {/* Quick Demo Role Selector */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Select Demo Role (For Viva Evaluation)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="role-btn-admin"
                onClick={() => handleRoleSelect('admin')}
                className={`flex flex-col items-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  selectedRole === 'admin'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 dark:bg-purple-950/50 dark:text-purple-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Shield className="w-4 h-4 mb-1 text-purple-600 dark:text-purple-400" />
                Admin
              </button>

              <button
                type="button"
                id="role-btn-student"
                onClick={() => handleRoleSelect('student')}
                className={`flex flex-col items-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  selectedRole === 'student'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <User className="w-4 h-4 mb-1 text-emerald-600 dark:text-emerald-400" />
                Student
              </button>

              <button
                type="button"
                id="role-btn-recruiter"
                onClick={() => handleRoleSelect('recruiter')}
                className={`flex flex-col items-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  selectedRole === 'recruiter'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-4 h-4 mb-1 text-blue-600 dark:text-blue-400" />
                Recruiter
              </button>
            </div>

            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              {demoAccounts[selectedRole].desc}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Username / Student ID
              </label>
              <div className="relative">
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or CS202301"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Academic Viva Note */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Verified Full-Stack College Project
            </div>
            <p className="text-[11px] leading-relaxed">
              Default passwords: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono">admin123</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono">student123</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono">recruiter123</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
