import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { studentService } from '../services/studentService';
import { applicationService } from '../services/applicationService';
import {
  User,
  GraduationCap,
  Mail,
  Phone,
  BookOpen,
  Award,
  Calendar,
  Save,
  CheckCircle,
  FileCheck,
} from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { student, refreshMe } = useAuth();
  const { success, error } = useToast();

  const [skills, setSkills] = useState(student?.skills || '');
  const [phone, setPhone] = useState(student?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [appStats, setAppStats] = useState({ total: 0, shortlisted: 0, selected: 0 });

  useEffect(() => {
    if (student) {
      setSkills(student.skills || '');
      setPhone(student.phone || '');

      applicationService.getAll({ student_id: student.id }).then((res) => {
        const apps = res.results;
        setAppStats({
          total: apps.length,
          shortlisted: apps.filter((a) => a.status === 'Shortlisted').length,
          selected: apps.filter((a) => a.status === 'Selected').length,
        });
      });
    }
  }, [student]);

  if (!student) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Student profile data not found.</p>
      </div>
    );
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await studentService.update(student.id, {
        skills: skills.trim(),
        phone: phone.trim(),
      });
      await refreshMe();
      success('Profile skills and contact updated successfully!', 'Profile Saved');
    } catch (err: any) {
      error(err.message || 'Failed to update profile.', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-bold text-white shadow-inner">
            {student.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{student.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white font-mono">
                {student.student_id}
              </span>
            </div>
            <p className="text-sm text-indigo-200 mt-0.5">
              {student.department} • Academic Year {student.year}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:border-l sm:border-white/20 sm:pl-6">
          <div>
            <span className="text-xs text-indigo-200 uppercase tracking-wider block font-medium">Placement Status</span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                student.placement_status === 'Placed'
                  ? 'bg-emerald-400 text-emerald-950 shadow-sm'
                  : 'bg-amber-300 text-amber-950'
              }`}
            >
              {student.placement_status === 'Placed' ? <CheckCircle className="w-3.5 h-3.5" /> : null}
              {student.placement_status}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">CGPA</span>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {student.cgpa.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-400">Scale of 10.0</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Backlogs</span>
          <p className={`text-2xl font-bold mt-1 ${student.backlogs > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {student.backlogs}
          </p>
          <span className="text-[11px] text-slate-400">Active arrears</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Drives Applied</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {appStats.total}
          </p>
          <span className="text-[11px] text-slate-400">Campus submissions</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Shortlisted</span>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {appStats.shortlisted}
          </p>
          <span className="text-[11px] text-slate-400">Interview calls</span>
        </div>
      </div>

      {/* Editable Details Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Candidate Profile & Skills
        </h3>

        <form onSubmit={handleUpdate} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Official Email (Read-only)
              </label>
              <input
                type="email"
                disabled
                value={student.email}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Technical Skills, Frameworks, and Tools (Comma-separated)
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. React, Node.js, Python, PostgreSQL, Data Structures, Git"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {skills.split(',').filter(Boolean).map((s, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-xl text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900"
              >
                {s.trim()}
              </span>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              id="save-profile-btn"
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
