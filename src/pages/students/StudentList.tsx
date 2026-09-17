import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { studentService } from '../../services/studentService';
import { Student } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export const StudentList: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { success, error } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [year, setYear] = useState('All');
  const [status, setStatus] = useState('All');

  // Deletion modal state
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Student details modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await studentService.getAll({
        search,
        department,
        year,
        placement_status: status,
        page: currentPage,
        page_size: 10,
      });
      setStudents(res.results);
      setTotalCount(res.count);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      error(err.message || 'Failed to fetch students from API', 'Error');
    } finally {
      setIsLoading(false);
    }
  }, [search, department, year, status, currentPage, error]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await studentService.delete(studentToDelete.id);
      success(`Student '${studentToDelete.name}' has been deleted.`, 'Student Removed');
      setStudentToDelete(null);
      fetchStudents();
    } catch (err: any) {
      error(err.message || 'Failed to delete student.', 'Error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            Student Directory
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage academic profiles, track CGPAs, active backlogs, and recruitment eligibility.
          </p>
        </div>

        {role === 'admin' && (
          <Link
            to="/students/new"
            id="add-student-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="student-search-input"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, ID, skills..."
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              id="student-dept-filter"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
            >
              <option value="All">All Departments</option>
              <option value="CSE">Computer Science (CSE)</option>
              <option value="AIML">AI & Machine Learning (AIML)</option>
              <option value="IT">Information Tech (IT)</option>
              <option value="ECE">Electronics (ECE)</option>
              <option value="EEE">Electrical (EEE)</option>
              <option value="MECH">Mechanical (MECH)</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              id="student-year-filter"
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
            >
              <option value="All">All Years</option>
              <option value="4">Final Year (Year 4)</option>
              <option value="3">Pre-Final (Year 3)</option>
              <option value="2">Year 2</option>
              <option value="1">Year 1</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              id="student-status-filter"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
            >
              <option value="All">All Placement Statuses</option>
              <option value="Not Placed">Not Placed</option>
              <option value="Placed">Placed</option>
              <option value="Not Eligible">Not Eligible</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>Found {totalCount} registered students in database</span>
          {(search || department !== 'All' || year !== 'All' || status !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setDepartment('All');
                setYear('All');
                setStatus('All');
                setCurrentPage(1);
              }}
              className="text-indigo-600 hover:text-indigo-800 font-medium underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Querying student records from database...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No students found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No student records match the active search or filter criteria. Try resetting filters or adding a new student.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Name & Email</th>
                  <th className="py-3.5 px-4">Dept</th>
                  <th className="py-3.5 px-4">Year</th>
                  <th className="py-3.5 px-4">CGPA</th>
                  <th className="py-3.5 px-4">Backlogs</th>
                  <th className="py-3.5 px-4">Placement Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                      {s.student_id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                          {s.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {s.email}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {s.department}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      Year {s.year}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block font-bold text-xs px-2 py-0.5 rounded-lg ${
                          s.cgpa >= 8.5
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : s.cgpa >= 7.0
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {s.cgpa.toFixed(2)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`font-medium text-xs ${
                          s.backlogs > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {s.backlogs}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          s.placement_status === 'Placed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : s.placement_status === 'Not Placed'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {s.placement_status === 'Placed' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {s.placement_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(s)}
                          title="View Student"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {role === 'admin' && (
                          <>
                            <Link
                              to={`/students/${s.id}/edit`}
                              title="Edit Student"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => setStudentToDelete(s)}
                              title="Delete Student"
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

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!studentToDelete}
        title="Delete Student Record?"
        message={`Are you sure you want to delete '${studentToDelete?.name}' (${studentToDelete?.student_id})? This will also remove their user credentials and associated placement applications.`}
        confirmText="Delete Student"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setStudentToDelete(null)}
      />

      {/* Student View Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedStudent.student_id}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedStudent.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedStudent.email}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-slate-400 block font-medium">Department:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedStudent.department}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Academic Year:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Year {selectedStudent.year}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">CGPA:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  {selectedStudent.cgpa.toFixed(2)} / 10.0
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Active Backlogs:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedStudent.backlogs}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Phone:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedStudent.phone}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Placement Status:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedStudent.placement_status}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-1">Technical Skills:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedStudent.skills ? (
                  selectedStudent.skills.split(',').map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-medium"
                    >
                      {skill.trim()}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No skills specified</span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Close
              </button>
              {role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/students/${selectedStudent.id}/edit`);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
