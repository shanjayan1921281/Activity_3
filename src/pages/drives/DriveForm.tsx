import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { driveService } from '../../services/driveService';
import { companyService } from '../../services/companyService';
import { useToast } from '../../context/ToastContext';
import { Briefcase, ArrowLeft, Save } from 'lucide-react';
import { Company, DriveStatus } from '../../types';

export const DriveForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState({
    company_id: '',
    job_role: '',
    job_description: '',
    package: '12.5 LPA',
    drive_date: new Date().toISOString().split('T')[0],
    minimum_cgpa: '7.5',
    max_backlogs: '0',
    eligible_branches: 'CSE, AIML, IT',
    eligible_batches: '2026',
    status: 'Active' as DriveStatus,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const initData = async () => {
      setIsFetching(true);
      try {
        const compRes = await companyService.getAll();
        setCompanies(compRes.results);

        if (compRes.results.length > 0 && !formData.company_id) {
          setFormData((prev) => ({ ...prev, company_id: String(compRes.results[0].id) }));
        }

        if (isEditMode && id) {
          const drive = await driveService.getById(parseInt(id, 10));
          setFormData({
            company_id: String(drive.company_id),
            job_role: drive.job_role,
            job_description: drive.job_description || '',
            package: drive.package,
            drive_date: drive.drive_date,
            minimum_cgpa: String(drive.minimum_cgpa),
            max_backlogs: String(drive.max_backlogs),
            eligible_branches: drive.eligible_branches || drive.allowed_departments || 'CSE, AIML, IT',
            eligible_batches: drive.eligible_batches || '2026',
            status: drive.status,
          });
        }
      } catch (err: any) {
        error(err.message || 'Failed to initialize form data.', 'Error');
      } finally {
        setIsFetching(false);
      }
    };

    initData();
  }, [id, isEditMode, error]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.company_id) {
      errs.company_id = 'Please select a company.';
    }
    if (!formData.job_role.trim()) {
      errs.job_role = 'Job Role title is required.';
    }
    if (!formData.package.trim()) {
      errs.package = 'Package CTC is required (e.g. 15.0 LPA).';
    }
    if (!formData.drive_date) {
      errs.drive_date = 'Drive date is required.';
    }

    const numCgpa = parseFloat(formData.minimum_cgpa);
    if (isNaN(numCgpa) || numCgpa < 0.0 || numCgpa > 10.0) {
      errs.minimum_cgpa = 'Minimum CGPA must be between 0.0 and 10.0.';
    }

    const numBacklogs = parseInt(formData.max_backlogs, 10);
    if (isNaN(numBacklogs) || numBacklogs < 0) {
      errs.max_backlogs = 'Max backlogs must be 0 or a positive integer.';
    }

    if (!formData.eligible_branches.trim()) {
      errs.eligible_branches = 'Please specify eligible branches.';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const payload = {
        company_id: parseInt(formData.company_id, 10),
        job_role: formData.job_role.trim(),
        job_description: formData.job_description.trim(),
        package: formData.package.trim(),
        drive_date: formData.drive_date,
        minimum_cgpa: parseFloat(formData.minimum_cgpa),
        max_backlogs: parseInt(formData.max_backlogs, 10),
        eligible_branches: formData.eligible_branches.trim(),
        eligible_batches: formData.eligible_batches.trim(),
        status: formData.status,
      };

      if (isEditMode && id) {
        await driveService.update(parseInt(id, 10), payload);
        success(`Placement drive for '${payload.job_role}' updated!`, 'Updated');
      } else {
        await driveService.create(payload);
        success(`Placement drive for '${payload.job_role}' scheduled!`, 'Created');
      }
      navigate('/drives');
    } catch (err: any) {
      error(err.message || 'Operation failed. Please review fields.', 'Error');
      if (err.data?.details) {
        setFormErrors(err.data.details);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Loading drive particulars...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Link
          to="/drives"
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isEditMode ? 'Edit Placement Drive' : 'Schedule Placement Drive'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Define eligibility thresholds, academic branches, compensation package, and timeline.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Company Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Recruiting Company <span className="text-rose-500">*</span>
              </label>
              <select
                id="drive-company-select"
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.company_id})
                  </option>
                ))}
              </select>
              {formErrors.company_id && (
                <p className="mt-1 text-xs text-rose-500">{formErrors.company_id}</p>
              )}
            </div>

            {/* Job Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Designation / Job Role <span className="text-rose-500">*</span>
              </label>
              <input
                id="drive-role-input"
                type="text"
                value={formData.job_role}
                onChange={(e) => setFormData({ ...formData, job_role: e.target.value })}
                placeholder="e.g. Associate Software Engineer"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white ${
                  formErrors.job_role
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {formErrors.job_role && (
                <p className="mt-1 text-xs text-rose-500">{formErrors.job_role}</p>
              )}
            </div>

            {/* Package */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Compensation Package (CTC) <span className="text-rose-500">*</span>
              </label>
              <input
                id="drive-package-input"
                type="text"
                value={formData.package}
                onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                placeholder="e.g. 14.5 LPA"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white ${
                  formErrors.package
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {formErrors.package && (
                <p className="mt-1 text-xs text-rose-500">{formErrors.package}</p>
              )}
            </div>

            {/* Drive Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Drive / Assessment Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="drive-date-input"
                type="date"
                value={formData.drive_date}
                onChange={(e) => setFormData({ ...formData, drive_date: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white ${
                  formErrors.drive_date
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {formErrors.drive_date && (
                <p className="mt-1 text-xs text-rose-500">{formErrors.drive_date}</p>
              )}
            </div>

            {/* Minimum CGPA */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Minimum CGPA Cut-off <span className="text-rose-500">*</span>
              </label>
              <input
                id="drive-min-cgpa-input"
                type="number"
                step="0.01"
                min="0.0"
                max="10.0"
                value={formData.minimum_cgpa}
                onChange={(e) => setFormData({ ...formData, minimum_cgpa: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white ${
                  formErrors.minimum_cgpa
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {formErrors.minimum_cgpa && (
                <p className="mt-1 text-xs text-rose-500">{formErrors.minimum_cgpa}</p>
              )}
            </div>

            {/* Maximum Backlogs Allowed */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Maximum Allowed Backlogs <span className="text-rose-500">*</span>
              </label>
              <input
                id="drive-max-backlogs-input"
                type="number"
                min="0"
                value={formData.max_backlogs}
                onChange={(e) => setFormData({ ...formData, max_backlogs: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white ${
                  formErrors.max_backlogs
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {formErrors.max_backlogs && (
                <p className="mt-1 text-xs text-rose-500">{formErrors.max_backlogs}</p>
              )}
            </div>

            {/* Eligible Branches */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Eligible Branches (Comma-separated) <span className="text-rose-500">*</span>
              </label>
              <input
                id="drive-branches-input"
                type="text"
                value={formData.eligible_branches}
                onChange={(e) => setFormData({ ...formData, eligible_branches: e.target.value })}
                placeholder="e.g. CSE, AIML, IT"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white ${
                  formErrors.eligible_branches
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {formErrors.eligible_branches && (
                <p className="mt-1 text-xs text-rose-500">{formErrors.eligible_branches}</p>
              )}
            </div>

            {/* Eligible Batches */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Eligible Passing Batches
              </label>
              <input
                id="drive-batches-input"
                type="text"
                value={formData.eligible_batches}
                onChange={(e) => setFormData({ ...formData, eligible_batches: e.target.value })}
                placeholder="e.g. 2026, Year 4"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
              >
              </input>
            </div>

            {/* Drive Status */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Drive Lifecycle Status
              </label>
              <select
                id="drive-status-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as DriveStatus })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
              >
                <option value="Active">Active (Accepting Applications)</option>
                <option value="Upcoming">Upcoming (Scheduled)</option>
                <option value="Completed">Completed (Shortlist Finalized)</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Job Description & Selection Process Rounds
            </label>
            <textarea
              id="drive-description-input"
              rows={4}
              value={formData.job_description}
              onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
              placeholder="Provide job details, technical stacks, online test syllabus, interview round breakdown..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              to="/drives"
              className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              id="drive-save-btn"
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEditMode ? 'Update Drive' : 'Schedule Drive'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
