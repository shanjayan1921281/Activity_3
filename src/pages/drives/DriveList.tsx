import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { driveService } from '../../services/driveService';
import { PlacementDrive } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  Users,
} from 'lucide-react';

export const DriveList: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { success, error } = useToast();

  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Deletion modal
  const [driveToDelete, setDriveToDelete] = useState<PlacementDrive | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View modal
  const [selectedDrive, setSelectedDrive] = useState<PlacementDrive | null>(null);

  const fetchDrives = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await driveService.getAll({
        search,
        status: statusFilter,
      });
      setDrives(res.results);
    } catch (err: any) {
      error(err.message || 'Failed to load placement drives.', 'Error');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, error]);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  const handleDelete = async () => {
    if (!driveToDelete) return;
    setIsDeleting(true);
    try {
      await driveService.delete(driveToDelete.id);
      success(`Placement drive '${driveToDelete.job_role}' deleted.`, 'Drive Removed');
      setDriveToDelete(null);
      fetchDrives();
    } catch (err: any) {
      error(err.message || 'Failed to delete placement drive.', 'Error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDetail = async (d: PlacementDrive) => {
    try {
      const fullDrive = await driveService.getById(d.id);
      setSelectedDrive(fullDrive);
    } catch (err: any) {
      setSelectedDrive(d);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            Campus Placement Drives
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Configure recruitment drives, package offerings, eligibility thresholds, and schedules.
          </p>
        </div>

        {(role === 'admin' || role === 'recruiter') && (
          <Link
            to="/drives/new"
            id="add-drive-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Schedule New Drive
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="drive-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job role, company name, or package..."
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <select
              id="drive-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Drives Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Loading placement drive records...</p>
          </div>
        ) : drives.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Briefcase className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No placement drives found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No recruitment schedules match the filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Role & Company</th>
                  <th className="py-3.5 px-4">Package (CTC)</th>
                  <th className="py-3.5 px-4">Drive Date</th>
                  <th className="py-3.5 px-4">Eligibility Criteria</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Applicants</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {drives.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                          {d.job_role}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {d.company_name}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      {d.package}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        {d.drive_date}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        Min CGPA: <span className="font-bold text-indigo-600 dark:text-indigo-400">{d.minimum_cgpa.toFixed(2)}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Max Backlogs: {d.max_backlogs} • Branches: {d.eligible_branches}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          d.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : d.status === 'Upcoming'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {d.applications_count ?? 0}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(d)}
                          title="View Drive"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {(role === 'admin' || role === 'recruiter') && (
                          <>
                            <Link
                              to={`/drives/${d.id}/edit`}
                              title="Edit Drive"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => setDriveToDelete(d)}
                              title="Delete Drive"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!driveToDelete}
        title="Cancel & Delete Placement Drive?"
        message={`Are you sure you want to delete the placement drive for '${driveToDelete?.job_role}' at '${driveToDelete?.company_name}'? This will also remove all student applications filed for this drive.`}
        confirmText="Delete Drive"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDriveToDelete(null)}
      />

      {/* Drive Details Modal */}
      {selectedDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block font-mono">
                  CTC: {selectedDrive.package}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedDrive.job_role}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {selectedDrive.company_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedDrive(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 font-medium">Drive Date:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedDrive.drive_date}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 font-medium">Minimum CGPA:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  {selectedDrive.minimum_cgpa.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 font-medium">Max Backlogs Allowed:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedDrive.max_backlogs}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 font-medium">Eligible Departments:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedDrive.eligible_branches}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 font-medium">Eligible Passing Batches:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedDrive.eligible_batches}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-medium">Status:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {selectedDrive.status}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Job Description & Scope:
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                {selectedDrive.job_description || 'No detailed description provided.'}
              </p>
            </div>

            {/* Applications for this drive */}
            {selectedDrive.applications && selectedDrive.applications.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Applicants ({selectedDrive.applications.length}):
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedDrive.applications.map((app) => (
                    <div
                      key={app.id}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {app.student_name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedDrive(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Close
              </button>
              {(role === 'admin' || role === 'recruiter') && (
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/drives/${selectedDrive.id}/edit`);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  Edit Drive
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
