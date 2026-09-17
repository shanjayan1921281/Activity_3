import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applicationService } from '../services/applicationService';
import { DashboardStats } from '../types';
import { StatCard } from '../components/common/StatCard';
import {
  Users,
  Building2,
  Briefcase,
  FileCheck,
  Award,
  TrendingUp,
  PlusCircle,
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, role, student } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await applicationService.getDashboardStats();
        setStats(data);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load dashboard metrics from backend.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Querying database metrics...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !stats) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-800 dark:text-rose-200">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-5 h-5" />
          <span>Error Loading Dashboard</span>
        </div>
        <p className="mt-1 text-sm">{errorMsg || 'Database statistics unavailable.'}</p>
      </div>
    );
  }

  const { summary, department_breakdown, recent_drives, recent_applications } = stats;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-indigo-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Academic Placement Session 2026–2027
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || user?.username}!
          </h2>
          <p className="mt-2 text-indigo-100/90 text-sm sm:text-base leading-relaxed">
            {role === 'admin' &&
              'Manage campus recruitment drives, review student profiles, process corporate shortlist applications, and monitor college placement percentages in real time.'}
            {role === 'student' &&
              `You are logged in as candidate ${student?.name || ''} (${student?.student_id || ''}). Current Status: ${
                student?.placement_status || 'Not Placed'
              }. Check upcoming drive criteria and apply.`}
            {role === 'recruiter' &&
              'Manage campus job postings, assess applicant prerequisites, and shortlist promising engineering candidates.'}
          </p>

          {/* Quick Action Buttons */}
          <div className="mt-5 flex flex-wrap gap-3">
            {role === 'admin' && (
              <>
                <Link
                  to="/students/new"
                  id="dash-add-student-btn"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-900 font-semibold text-xs sm:text-sm hover:bg-indigo-50 transition-colors shadow-sm"
                >
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  Add Student
                </Link>
                <Link
                  to="/companies/new"
                  id="dash-add-company-btn"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm transition-colors backdrop-blur-md"
                >
                  <Building2 className="w-4 h-4" />
                  Add Company
                </Link>
                <Link
                  to="/drives/new"
                  id="dash-add-drive-btn"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm transition-colors backdrop-blur-md"
                >
                  <Briefcase className="w-4 h-4" />
                  Post Placement Drive
                </Link>
              </>
            )}

            {role === 'student' && (
              <>
                <Link
                  to="/available-drives"
                  id="dash-browse-drives-btn"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-900 font-semibold text-xs sm:text-sm hover:bg-indigo-50 transition-colors shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Browse Available Drives
                </Link>
                <Link
                  to="/applications"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm transition-colors backdrop-blur-md"
                >
                  <FileCheck className="w-4 h-4" />
                  Track My Applications
                </Link>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm transition-colors backdrop-blur-md"
                >
                  <Users className="w-4 h-4" />
                  View/Update Profile
                </Link>
              </>
            )}

            {role === 'recruiter' && (
              <>
                <Link
                  to="/drives/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-900 font-semibold text-xs sm:text-sm hover:bg-indigo-50 transition-colors shadow-sm"
                >
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  Post New Drive
                </Link>
                <Link
                  to="/applications"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm transition-colors backdrop-blur-md"
                >
                  <FileCheck className="w-4 h-4" />
                  Review Applicants
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          id="stat-total-students"
          title="Total Students"
          value={summary.total_students}
          subtitle="Enrolled candidates"
          icon={Users}
          color="indigo"
        />
        <StatCard
          id="stat-total-companies"
          title="Total Companies"
          value={summary.total_companies}
          subtitle="Recruiting partners"
          icon={Building2}
          color="blue"
        />
        <StatCard
          id="stat-active-drives"
          title="Active Drives"
          value={summary.active_drives}
          subtitle={`${summary.total_drives} total drives`}
          icon={Briefcase}
          color="purple"
        />
        <StatCard
          id="stat-total-applications"
          title="Applications"
          value={summary.total_applications}
          subtitle="Student submissions"
          icon={FileCheck}
          color="amber"
        />
        <StatCard
          id="stat-selected-students"
          title="Selected"
          value={summary.total_selected}
          subtitle={`${summary.total_placed} placed candidates`}
          icon={Award}
          color="emerald"
        />
        <StatCard
          id="stat-placement-percentage"
          title="Placement %"
          value={`${summary.placement_percentage}%`}
          subtitle="Batch conversion"
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      {/* Breakdown & Recent Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Placement Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Department Statistics</h3>
            <span className="text-xs font-semibold text-slate-400">Total / Placed</span>
          </div>

          <div className="space-y-3">
            {department_breakdown.map((dept) => {
              const pct = dept.total > 0 ? Math.round((dept.placed / dept.total) * 100) : 0;
              return (
                <div key={dept.department} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {dept.department}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {dept.placed} of {dept.total} placed ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Placed: {summary.total_placed}</span>
            <span>Not Placed: {summary.total_not_placed}</span>
            <span>Not Eligible: {summary.total_not_eligible}</span>
          </div>
        </div>

        {/* Recent Placement Drives */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Placement Drives</h3>
            <Link
              to={role === 'student' ? '/available-drives' : '/drives'}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-0.5"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recent_drives.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No placement drives registered yet.</p>
            ) : (
              recent_drives.map((d) => (
                <div
                  key={d.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {d.job_role}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {d.company_name} • {d.package}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        d.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : d.status === 'Upcoming'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {d.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-end gap-1">
                      <Calendar className="w-3 h-3" /> {d.drive_date}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Applications Feed */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Applications</h3>
            <Link
              to="/applications"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-0.5"
            >
              Manage <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recent_applications.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No applications submitted yet.</p>
            ) : (
              recent_applications.map((app) => (
                <div
                  key={app.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {app.student_name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {app.company_name} — {app.job_role}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      app.status === 'Selected'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : app.status === 'Shortlisted'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : app.status === 'Rejected'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
