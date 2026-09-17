import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { companyService } from '../../services/companyService';
import { Company } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Globe,
  Mail,
  MapPin,
  Briefcase,
  ExternalLink,
} from 'lucide-react';

export const CompanyList: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { success, error } = useToast();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('All');

  // Deletion modal
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View modal
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await companyService.getAll({ search, industry });
      setCompanies(res.results);
    } catch (err: any) {
      error(err.message || 'Failed to load companies.', 'Error');
    } finally {
      setIsLoading(false);
    }
  }, [search, industry, error]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleDelete = async () => {
    if (!companyToDelete) return;
    setIsDeleting(true);
    try {
      await companyService.delete(companyToDelete.id);
      success(`Company '${companyToDelete.company_name}' removed.`, 'Deleted');
      setCompanyToDelete(null);
      fetchCompanies();
    } catch (err: any) {
      error(err.message || 'Failed to delete company.', 'Error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDetail = async (comp: Company) => {
    try {
      const fullComp = await companyService.getById(comp.id);
      setSelectedCompany(fullComp);
    } catch (err: any) {
      setSelectedCompany(comp);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-600" />
            Recruiting Companies
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage corporate campus recruitment partners, industry domains, and HR contacts.
          </p>
        </div>

        {role === 'admin' && (
          <Link
            to="/companies/new"
            id="add-company-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Company
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="company-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies by name, ID, location, or contact..."
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <select
              id="company-industry-filter"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
            >
              <option value="All">All Industries</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Software & Cloud Computing">Software & Cloud Computing</option>
              <option value="Investment Banking & FinTech">Investment Banking & FinTech</option>
              <option value="E-commerce & Cloud Services">E-commerce & Cloud Services</option>
              <option value="IT Services & Consulting">IT Services & Consulting</option>
            </select>
          </div>
        </div>
      </div>

      {/* Company List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Querying registered companies from database...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No companies found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No company records match your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Company ID</th>
                  <th className="py-3.5 px-4">Company Name</th>
                  <th className="py-3.5 px-4">Industry</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4 text-center">Drives</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {companies.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                      {c.company_id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                          {c.company_name}
                        </p>
                        {c.website && (
                          <a
                            href={c.website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5"
                          >
                            <Globe className="w-3 h-3" />
                            Website
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {c.industry}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {c.location}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {c.contact_person}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {c.contact_email}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {c.drives_count ?? 0} drives
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(c)}
                          title="View Company"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {role === 'admin' && (
                          <>
                            <Link
                              to={`/companies/${c.id}/edit`}
                              title="Edit Company"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => setCompanyToDelete(c)}
                              title="Delete Company"
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
        isOpen={!!companyToDelete}
        title="Delete Company?"
        message={`Are you sure you want to delete '${companyToDelete?.company_name}' (${companyToDelete?.company_id})? This will also delete all associated placement drives and student applications.`}
        confirmText="Delete Company"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setCompanyToDelete(null)}
      />

      {/* Company View Details Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedCompany.company_id}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedCompany.company_name}
                </h3>
                <p className="text-xs text-slate-500">{selectedCompany.industry}</p>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 font-medium">Headquarters / Location:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedCompany.location}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 font-medium">Contact Person:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedCompany.contact_person}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 font-medium">Contact Email:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedCompany.contact_email}
                </span>
              </div>
              {selectedCompany.website && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Official Portal:</span>
                  <a
                    href={selectedCompany.website}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    {selectedCompany.website} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Drives by this company */}
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Placement Drives ({selectedCompany.drives?.length || 0}):
              </span>
              {selectedCompany.drives && selectedCompany.drives.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedCompany.drives.map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{d.job_role}</p>
                        <p className="text-slate-500">
                          Package: {d.package} • Min CGPA: {d.minimum_cgpa}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No placement drives posted yet.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Close
              </button>
              {role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/companies/${selectedCompany.id}/edit`);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  Edit Company
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
