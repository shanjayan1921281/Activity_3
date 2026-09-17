import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileCheck,
  User,
  Sparkles,
  Layers,
  Terminal,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role, user, student } = useAuth();

  const getNavLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/students', label: 'Students', icon: Users, badge: 'CRUD' },
          { to: '/companies', label: 'Companies', icon: Building2, badge: 'CRUD' },
          { to: '/drives', label: 'Placement Drives', icon: Briefcase, badge: 'CRUD' },
          { to: '/applications', label: 'Applications', icon: FileCheck },
          { to: '/api-docs', label: 'Postman & Viva Docs', icon: Terminal },
        ];
      case 'student':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/available-drives', label: 'Available Drives', icon: Sparkles, badge: 'Eligibility' },
          { to: '/applications', label: 'My Applications', icon: FileCheck },
          { to: '/profile', label: 'My Profile', icon: User },
          { to: '/api-docs', label: 'API & Project Docs', icon: Terminal },
        ];
      case 'recruiter':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/companies', label: 'Company Info', icon: Building2 },
          { to: '/drives', label: 'Our Drives', icon: Briefcase },
          { to: '/applications', label: 'Applicant Shortlist', icon: FileCheck },
          { to: '/api-docs', label: 'API Reference', icon: Terminal },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-16 bottom-0 left-0 z-20 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* User Context Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user?.name || user?.username}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {role === 'admin'
                    ? 'Placement Cell'
                    : role === 'student'
                    ? `${student?.department || 'Student'} • Year ${student?.year || '4'}`
                    : 'Recruiter'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Group */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Navigation
            </p>
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                        <span>{link.label}</span>
                      </div>
                      {link.badge && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}
                        >
                          {link.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Footer info for College Viva */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-900 dark:text-indigo-200">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Full-Stack Architecture
            </div>
            <p className="mt-1 text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              React + REST API + SQLite. Enforces real CRUD, Foreign Keys, & Eligibility logic.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
