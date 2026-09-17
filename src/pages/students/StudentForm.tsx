import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Users, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { PlacementStatus } from '../../types';

export const StudentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { role } = useAuth();

  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    email: '',
    phone: '',
    department: 'CSE',
    year: '4',
    cgpa: '8.00',
    skills: '',
    backlogs: '0',
    placement_status: 'Not Placed' as PlacementStatus,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode && id) {
      const loadStudent = async () => {
        setIsFetching(true);
        try {
          const student = await studentService.getById(parseInt(id, 10));
          setFormData({
            student_id: student.student_id,
            name: student.name,
            email: student.email,
            phone: student.phone,
            department: student.department,
            year: String(student.year),
            cgpa: String(student.cgpa),
            skills: student.skills || '',
            backlogs: String(student.backlogs),
            placement_status: student.placement_status,
          });
        } catch (err: any) {
          error(err.message || 'Failed to fetch student details.', 'Error');
          navigate('/students');
        } finally {
          setIsFetching(false);
        }
      };
      loadStudent();
    }
  }, [id, isEditMode, navigate, error]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.student_id.trim()) {
      errs.student_id = 'Student ID is required (e.g. CS202301).';
    }

    if (!formData.name.trim()) {
      errs.name = 'Full Name is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address.';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required.';
    }

    const numCgpa = parseFloat(formData.cgpa);
    if (isNaN(numCgpa) || numCgpa < 0.0 || numCgpa > 10.0) {
      errs.cgpa = 'CGPA must be a decimal between 0.0 and 10.0.';
    }

    const numBacklogs = parseInt(formData.backlogs, 10);
    if (isNaN(numBacklogs) || numBacklogs < 0) {
      errs.backlogs = 'Backlogs count cannot be negative.';
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
        student_id: formData.student_id.trim().toUpperCase(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        department: formData.department,
        year: parseInt(formData.year, 10),
        cgpa: parseFloat(formData.cgpa),
        skills: formData.skills.trim(),
        backlogs: parseInt(formData.backlogs, 10),
        placement_status: formData.placement_status,
      };

      if (isEditMode && id) {
        await studentService.update(parseInt(id, 10), payload);
        success(`Student '${payload.name}' updated successfully!`, 'Updated');
      } else {
        await studentService.create(payload);
        success(`Student '${payload.name}' registered successfully!`, 'Created');
      }
      navigate('/students');
    } catch (err: any) {
      error(err.message || 'Operation failed. Please check form entries.', 'Submission Error');
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
        <p className="text-xs text-slate-500">Retrieving student record...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Link
          to="/students"
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isEditMode ? 'Edit Student Record' : 'Register New Student'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isEditMode
              ? 'Update academic profile, CGPA score, and recruitment placement status.'
              : 'Add candidate profile to the campus placement database.'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Student ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Student ID / Roll No <span className="text-rose-500">*</span>
              </label>
              <input
                id="student-id-input"
                type="text"
                disabled={isEditMode && role !== 'admin'}
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                placeholder="e.g. CS202305"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white font-mono ${
                  formErrors.student_id
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {formErrors.student_id && (
                <p className="mt-1 text-xs text-rose-500">{formErrors.student_id}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="student-name-input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Aarav Sharma"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white ${
                  formErrors.name
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {formErrors.name && <p className="mt-1 text-xs text-rose-500">{formErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="student-email-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@college.edu"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white ${
                  formErrors.email
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {formErrors.email && <p className="mt-1 text-xs text-rose-500">{formErrors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="student-phone-input"
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white ${
                  formErrors.phone
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {formErrors.phone && <p className="mt-1 text-xs text-rose-500">{formErrors.phone}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                id="student-department-select"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
              >
                <option value="CSE">Computer Science and Engineering (CSE)</option>
                <option value="AIML">Artificial Intelligence & Machine Learning (AIML)</option>
                <option value="IT">Information Technology (IT)</option>
                <option value="ECE">Electronics and Communication (ECE)</option>
                <option value="EEE">Electrical & Electronics (EEE)</option>
                <option value="MECH">Mechanical Engineering (MECH)</option>
                <option value="CIVIL">Civil Engineering (CIVIL)</option>
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Academic Year <span className="text-rose-500">*</span>
              </label>
              <select
                id="student-year-select"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
              >
                <option value="4">4th Year (Final Year)</option>
                <option value="3">3rd Year (Pre-Final)</option>
                <option value="2">2nd Year</option>
                <option value="1">1st Year</option>
              </select>
            </div>

            {/* CGPA */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Cumulative GPA (0.0 – 10.0) <span className="text-rose-500">*</span>
              </label>
              <input
                id="student-cgpa-input"
                type="number"
                step="0.01"
                min="0.0"
                max="10.0"
                value={formData.cgpa}
                onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white ${
                  formErrors.cgpa
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {formErrors.cgpa && <p className="mt-1 text-xs text-rose-500">{formErrors.cgpa}</p>}
            </div>

            {/* Backlogs */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Active Backlogs (0 or more) <span className="text-rose-500">*</span>
              </label>
              <input
                id="student-backlogs-input"
                type="number"
                min="0"
                value={formData.backlogs}
                onChange={(e) => setFormData({ ...formData, backlogs: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white ${
                  formErrors.backlogs
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {formErrors.backlogs && (
                <p className="mt-1 text-xs text-rose-500">{formErrors.backlogs}</p>
              )}
            </div>
          </div>

          {/* Technical Skills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Technical Skills & Certifications (Comma-separated)
            </label>
            <input
              id="student-skills-input"
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="e.g. React, Node.js, Python, PostgreSQL, AWS, Docker"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          {/* Placement Status (Admin Only) */}
          {role === 'admin' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Placement Status
              </label>
              <select
                id="student-status-select"
                value={formData.placement_status}
                onChange={(e) =>
                  setFormData({ ...formData, placement_status: e.target.value as PlacementStatus })
                }
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
              >
                <option value="Not Placed">Not Placed</option>
                <option value="Placed">Placed</option>
                <option value="Not Eligible">Not Eligible</option>
              </select>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              to="/students"
              className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              id="student-save-btn"
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEditMode ? 'Update Student' : 'Save Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
