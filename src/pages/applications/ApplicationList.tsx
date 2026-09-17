import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { applicationService } from '../../services/applicationService';
import { Application, ApplicationStatus } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Building2,
  User,
  Calendar,
  Trash2,
  Sparkles,
} from 'lucide-react';

export const ApplicationList: React.FC = () => {
  const { role, student, user } = useAuth();
  const { success, error } = useToast();

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Status Change State
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('Shortlisted');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Withdraw State
  const [appToWithdraw, setAppToWithdraw] = useState<Application | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        search,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      };

      // If student, filter by their student ID
      if (role === 'student' && student) {
        params.student_id = student.id;
      }

      const res = await applicationService.getAll(params);
      setApplications(res.results);
    } catch (err: any) {
      error(err.message || 'Failed to load applications.', 'Error');
    } finally {
      setIsLoading(false);
    }
  }, [role, student, search, statusFilter, error]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleUpdateStatus = async () => {
    if (!selectedApp) return;
    setIsUpdatingStatus(true);
    try {
      await applicationService.updateStatus(selectedApp.id, {
        status: newStatus,
        remarks: statusRemarks.trim() || undefined,
      });
      success(
        `Application status for ${selectedApp.student_name} updated to '${newStatus}'!`,
        'Status Updated'
      );
      setSelectedApp(null);
      fetchApplications();
    } catch (err: any) {
      error(err.message || 'Failed to update application status.', 'Error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleWithdraw = async () => {
    if (!appToWithdraw) return;
    setIsWithdrawing(true);
    try {
      await applicationService.withdraw(appToWithdraw.id);
      success('Application withdrawn successfully.', 'Withdrawn');
      setAppToWithdraw(null);
      fetchApplications();
    } catch (err: any) {
      error(err.message || 'Failed to withdraw application.', 'Error');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <FileCheck className="w-6 h-6 text-indigo-600" />
          {role === 'student' ? 'My Campus Applications' : 'Candidate Applications & Shortlisting'}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {role === 'student'
            ? 'Monitor application review milestones, shortlisting stages, and final job selection offers.'
            : 'Review candidate applications, change recruitment pipeline stages (Applied → Shortlisted → Selected / Rejected).'}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="app-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, roll number, company, or job role..."
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <select
              id="app-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
            >
              <option value="All">All Application Stages</option>
              <option value="Applied">Applied</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Selected">Selected (Placed)</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Querying applications database...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <FileCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No applications found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {role === 'student'
                ? "You haven't submitted applications for any drives yet. Visit Available Drives to apply."
                : 'No student candidates have applied under this filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">App ID</th>
                  <th className="py-3.5 px-4">Candidate Name & ID</th>
                  <th className="py-3.5 px-4">Company & Designation</th>
                  <th className="py-3.5 px-4">Package</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4 text-center">Current Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                      #{app.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                          {app.student_name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {app.student_id_code} • {app.student_dept} (CGPA: {app.student_cgpa?.toFixed(2)})
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                          {app.job_role}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          {app.company_name}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      {app.package}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        {app.applied_date}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          app.status === 'Selected'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : app.status === 'Shortlisted'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                            : app.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {app.status === 'Selected' && <Award className="w-3 h-3 text-emerald-600" />}
                        {app.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Admin / Recruiter: Update Status */}
                        {(role === 'admin' || role === 'recruiter') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApp(app);
                              setNewStatus(app.status);
                              setStatusRemarks(app.remarks || '');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 transition-colors"
                          >
                            Update Stage
                          </button>
                        )}

                        {/* Student: Withdraw if still 'Applied' */}
                        {role === 'student' && app.status === 'Applied' && (
                          <button
                            type="button"
                            onClick={() => setAppToWithdraw(app)}
                            title="Withdraw Application"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Update Modal (Admin / Recruiter) */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono">
                  Application #{selectedApp.id}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Update Candidate Stage
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedApp.student_name} • {selectedApp.job_role}
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                New Recruitment Stage
              </label>
              <select
                id="update-status-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white font-medium"
              >
                <option value="Applied">Applied (Initial Submission)</option>
                <option value="Shortlisted">Shortlisted (Selected for Interview)</option>
                <option value="Selected">Selected (Offered / Placed 🎉)</option>
                <option value="Rejected">Rejected</option>
              </select>
              {newStatus === 'Selected' && (
                <p className="mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Marking as Selected will automatically update the student's status to 'Placed' in the college database!
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Interviewer / Cell Remarks
              </label>
              <textarea
                rows={3}
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
                placeholder="e.g. Cleared technical interview round 2, HR offer issued..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="save-status-btn"
                disabled={isUpdatingStatus}
                onClick={handleUpdateStatus}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isUpdatingStatus && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Save Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal (Student) */}
      <ConfirmModal
        isOpen={!!appToWithdraw}
        title="Withdraw Application?"
        message={`Are you sure you want to withdraw your application for '${appToWithdraw?.job_role}' at '${appToWithdraw?.company_name}'? You can re-apply if the drive remains active.`}
        confirmText="Withdraw Application"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isWithdrawing}
        onConfirm={handleWithdraw}
        onCancel={() => setAppToWithdraw(null)}
      />
    </div>
  );
};
