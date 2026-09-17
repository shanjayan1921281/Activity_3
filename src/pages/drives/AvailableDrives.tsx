import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { driveService } from '../../services/driveService';
import { applicationService } from '../../services/applicationService';
import { PlacementDrive, EligibilityResult, Application } from '../../types';
import { EligibilityBadge } from '../../components/common/EligibilityBadge';
import {
  Sparkles,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Info,
  Send,
  AlertCircle,
} from 'lucide-react';

export const AvailableDrives: React.FC = () => {
  const { student } = useAuth();
  const { success, error, info } = useToast();

  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [eligibilityMap, setEligibilityMap] = useState<Record<number, EligibilityResult>>({});
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Apply modal
  const [driveToApply, setDriveToApply] = useState<PlacementDrive | null>(null);
  const [applyRemarks, setApplyRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Criteria Details modal
  const [detailsDrive, setDetailsDrive] = useState<PlacementDrive | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch drives
      const drivesRes = await driveService.getAll({ status: 'Active' });
      setDrives(drivesRes.results);

      // 2. If student logged in, fetch their applications and check eligibility for each drive
      if (student) {
        const appRes = await applicationService.getAll({ student_id: student.id });
        setMyApplications(appRes.results);

        // Check eligibility for each drive in parallel
        const map: Record<number, EligibilityResult> = {};
        await Promise.all(
          drivesRes.results.map(async (d) => {
            try {
              const elig = await driveService.checkEligibility(d.id, student.id);
              map[d.id] = elig;
            } catch (e) {
              // ignore single failure
            }
          })
        );
        setEligibilityMap(map);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load recruitment drives.', 'Error');
    } finally {
      setIsLoading(false);
    }
  }, [student, error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApply = async () => {
    if (!driveToApply) return;
    setIsSubmitting(true);
    try {
      await applicationService.apply({
        placement_drive_id: driveToApply.id,
        remarks: applyRemarks.trim() || undefined,
      });
      success(
        `Application submitted successfully for ${driveToApply.job_role} at ${driveToApply.company_name}!`,
        'Application Sent'
      );
      setDriveToApply(null);
      setApplyRemarks('');
      loadData();
    } catch (err: any) {
      error(err.message || 'Application could not be submitted.', 'Application Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getExistingApp = (driveId: number): Application | undefined => {
    return myApplications.find((app) => app.placement_drive_id === driveId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-indigo-200 mb-3 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Live Candidate Recruitment Portal
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Available Placement Drives
          </h2>
          <p className="mt-2 text-indigo-100 text-xs sm:text-sm leading-relaxed">
            Review live campus placement opportunities. The system automatically cross-references
            your academic CGPA ({student?.cgpa.toFixed(2)}), active backlogs ({student?.backlogs}),
            and department ({student?.department}) with company criteria.
          </p>
        </div>
      </div>

      {/* Drives Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Checking eligibility against all active drives...</p>
        </div>
      ) : drives.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
            No active placement drives currently open.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Check back soon or contact your college placement officer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {drives.map((d) => {
            const eligibility = eligibilityMap[d.id];
            const existingApp = getExistingApp(d.id);

            return (
              <div
                key={d.id}
                id={`drive-card-${d.id}`}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  {/* Top Bar: Company & CTC */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {d.company_name}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-snug">
                        {d.job_role}
                      </h3>
                    </div>

                    <span className="shrink-0 px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {d.package}
                    </span>
                  </div>

                  {/* Drive Date */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span>Drive Date: <strong className="text-slate-700 dark:text-slate-200">{d.drive_date}</strong></span>
                  </div>

                  {/* Criteria Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Min CGPA Required:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {d.minimum_cgpa.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Max Backlogs Allowed:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {d.max_backlogs}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Eligible Branches:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                        {d.eligible_branches}
                      </span>
                    </div>
                  </div>

                  {/* Description Preview */}
                  {d.job_description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {d.job_description}
                    </p>
                  )}
                </div>

                {/* Bottom Action Area */}
                <div className="p-4 bg-slate-50/75 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {/* Status Indicator */}
                  {existingApp ? (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        existingApp.status === 'Selected'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : existingApp.status === 'Shortlisted'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : existingApp.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Status: {existingApp.status}
                    </span>
                  ) : (
                    <EligibilityBadge
                      eligibility={eligibility}
                      onOpenDetails={() => setDetailsDrive(d)}
                    />
                  )}

                  {/* Apply Button */}
                  {!existingApp && (
                    <button
                      type="button"
                      id={`apply-btn-${d.id}`}
                      disabled={!eligibility?.isEligible}
                      onClick={() => setDriveToApply(d)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition-all disabled:opacity-40 disabled:hover:bg-indigo-600 flex items-center gap-1.5"
                    >
                      <span>Apply</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Modal */}
      {driveToApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Campus Drive Application
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Apply for {driveToApply.job_role}
                </h3>
                <p className="text-xs text-slate-500">{driveToApply.company_name} • {driveToApply.package}</p>
              </div>
              <button
                onClick={() => setDriveToApply(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Eligibility Verified!
              </p>
              <p className="text-[11px] leading-relaxed">
                Your profile ({student?.department}, CGPA {student?.cgpa.toFixed(2)}, {student?.backlogs} backlogs) meets all prerequisites for this drive.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Remarks / Cover Note (Optional)
              </label>
              <textarea
                rows={3}
                value={applyRemarks}
                onChange={(e) => setApplyRemarks(e.target.value)}
                placeholder="Mention relevant project links, GitHub profile, or domain interests..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDriveToApply(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="submit-application-btn"
                disabled={isSubmitting}
                onClick={handleApply}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Criteria Breakdown Modal */}
      {detailsDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Eligibility Evaluation Breakdown
                </h3>
                <p className="text-xs text-slate-500">{detailsDrive.job_role} at {detailsDrive.company_name}</p>
              </div>
              <button
                onClick={() => setDetailsDrive(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Checklist */}
            <div className="space-y-2 text-xs">
              {eligibilityMap[detailsDrive.id]?.checks ? (
                <>
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      eligibilityMap[detailsDrive.id].checks!.cgpa.passed
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50/70 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {eligibilityMap[detailsDrive.id].checks!.cgpa.passed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold block">CGPA Requirement:</span>
                      <span className="text-[11px] leading-relaxed">
                        {eligibilityMap[detailsDrive.id].checks!.cgpa.message}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      eligibilityMap[detailsDrive.id].checks!.department.passed
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50/70 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {eligibilityMap[detailsDrive.id].checks!.department.passed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold block">Department Eligibility:</span>
                      <span className="text-[11px] leading-relaxed">
                        {eligibilityMap[detailsDrive.id].checks!.department.message}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      eligibilityMap[detailsDrive.id].checks!.backlogs.passed
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50/70 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {eligibilityMap[detailsDrive.id].checks!.backlogs.passed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold block">Backlog Restriction:</span>
                      <span className="text-[11px] leading-relaxed">
                        {eligibilityMap[detailsDrive.id].checks!.backlogs.message}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-3 bg-slate-50 text-slate-600 rounded-xl text-center">
                  Eligibility criteria loaded.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDetailsDrive(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
