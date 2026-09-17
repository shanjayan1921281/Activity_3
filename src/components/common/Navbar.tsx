import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { applicationService } from '../../services/applicationService';
import { ConfirmModal } from './ConfirmModal';
import {
  GraduationCap,
  LogOut,
  UserCheck,
  Shield,
  Briefcase,
  RotateCcw,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { Role } from '../../types';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, role, logout, quickLogin, refreshMe } = useAuth();
  const { success, error } = useToast();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await applicationService.resetDemoData();
      await refreshMe();
      success('Database reset to clean sample college placement data successfully!', 'Data Reset');
      setIsResetModalOpen(false);
      // Reload page to refresh all active views
      window.location.reload();
    } catch (err: any) {
      error(err.message || 'Failed to reset database', 'Error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleQuickSwitch = async (targetRole: Role) => {
    try {
      await quickLogin(targetRole);
      success(`Switched role to ${targetRole.toUpperCase()}`, 'Role Changed');
    } catch (err: any) {
      error('Failed to switch role', 'Error');
    }
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <Shield className="w-3 h-3" />
            Placement Cell (Admin)
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <UserCheck className="w-3 h-3" />
            Candidate (Student)
          </span>
        );
      case 'recruiter':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Briefcase className="w-3 h-3" />
            Corporate (Recruiter)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <header
        id="app-navbar"
        className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Mobile Toggle & Title */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="sidebar-toggle-btn"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle navigation sidebar"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                    CPMS Portal
                  </h1>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
                    College Placement Management System
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Viva Quick Role Switcher */}
            <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Demo Role:
              </span>
              <button
                type="button"
                id="quick-switch-admin"
                onClick={() => handleQuickSwitch('admin')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  role === 'admin'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                id="quick-switch-student"
                onClick={() => handleQuickSwitch('student')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  role === 'student'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                id="quick-switch-recruiter"
                onClick={() => handleQuickSwitch('recruiter')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  role === 'recruiter'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Recruiter
              </button>
            </div>

            {/* Right: User profile, Reset data, Logout */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {user?.name || user?.username}
                </span>
                <div className="mt-0.5">{getRoleBadge()}</div>
              </div>

              {role === 'admin' && (
                <button
                  type="button"
                  id="reset-demo-data-btn"
                  onClick={() => setIsResetModalOpen(true)}
                  title="Reset Sample College Data"
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40 rounded-xl transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                id="logout-btn"
                onClick={logout}
                title="Log Out"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/50 rounded-xl transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Database Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Reset Demo Placement Database?"
        message="This will reset students, companies, placement drives, and application records back to standard sample college data. Use this anytime during your viva or testing demonstration."
        confirmText="Reset Database"
        cancelText="Cancel"
        isDestructive={false}
        isLoading={isResetting}
        onConfirm={handleResetData}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </>
  );
};
