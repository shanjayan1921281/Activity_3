import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { companyService } from '../../services/companyService';
import { useToast } from '../../context/ToastContext';
import { Building2, ArrowLeft, Save } from 'lucide-react';

export const CompanyForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    company_id: '',
    company_name: '',
    industry: 'Information Technology',
    website: '',
    location: '',
    contact_person: '',
    contact_email: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode && id) {
      const loadCompany = async () => {
        setIsFetching(true);
        try {
          const comp = await companyService.getById(parseInt(id, 10));
          setFormData({
            company_id: comp.company_id,
            company_name: comp.company_name,
            industry: comp.industry,
            website: comp.website || '',
            location: comp.location,
            contact_person: comp.contact_person,
            contact_email: comp.contact_email,
          });
        } catch (err: any) {
          error(err.message || 'Failed to fetch company details.', 'Error');
          navigate('/companies');
        } finally {
          setIsFetching(false);
        }
      };
      loadCompany();
    }
  }, [id, isEditMode, navigate, error]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.company_id.trim()) {
      errs.company_id = 'Company ID is required (e.g. CMP005).';
    }
    if (!formData.company_name.trim()) {
      errs.company_name = 'Company Name is required.';
    }
    if (!formData.industry.trim()) {
      errs.industry = 'Industry domain is required.';
    }
    if (!formData.location.trim()) {
      errs.location = 'Headquarters / Location is required.';
    }
    if (!formData.contact_person.trim()) {
      errs.contact_person = 'Contact Person name is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.contact_email.trim()) {
      errs.contact_email = 'Contact Email is required.';
    } else if (!emailRegex.test(formData.contact_email.trim())) {
      errs.contact_email = 'Please provide a valid email address.';
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
        company_id: formData.company_id.trim().toUpperCase(),
        company_name: formData.company_name.trim(),
        industry: formData.industry.trim(),
        website: formData.website.trim(),
        location: formData.location.trim(),
        contact_person: formData.contact_person.trim(),
        contact_email: formData.contact_email.trim().toLowerCase(),
      };

      if (isEditMode && id) {
        await companyService.update(parseInt(id, 10), payload);
        success(`Company '${payload.company_name}' updated successfully!`, 'Updated');
      } else {
        await companyService.create(payload);
        success(`Company '${payload.company_name}' registered successfully!`, 'Created');
      }
      navigate('/companies');
    } catch (err: any) {
      error(err.message || 'Operation failed. Please check form inputs.', 'Error');
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
        <p className="text-xs text-slate-500">Retrieving company record...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Link
          to="/companies"
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isEditMode ? 'Edit Company Record' : 'Register Recruiting Partner'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isEditMode
              ? 'Update company particulars and HR point of contact.'
              : 'Add a new recruitment organization to the campus placement network.'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Company ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Company ID <span className="text-rose-500">*</span>
              </label>
              <input
                id="company-id-input"
                type="text"
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                placeholder="e.g. CMP006"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white font-mono ${
                  formErrors.company_id
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {formErrors.company_id && (
                <p className="mt-1 text-xs text-rose-500">{formErrors.company_id}</p>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="company-name-input"
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="e.g. Cisco Systems"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white ${
                  formErrors.company_name
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {formErrors.company_name && (
                <p className="mt-1 text-xs text-rose-500">{formErrors.company_name}</p>
              )}
            </div>

            {/* Industry */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Industry Sector <span className="text-rose-500">*</span>
              </label>
              <select
                id="company-industry-select"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
              >
                <option value="Information Technology">Information Technology</option>
                <option value="Software & Cloud Computing">Software & Cloud Computing</option>
                <option value="Investment Banking & FinTech">Investment Banking & FinTech</option>
                <option value="E-commerce & Cloud Services">E-commerce & Cloud Services</option>
                <option value="IT Services & Consulting">IT Services & Consulting</option>
                <option value="Automotive & Manufacturing">Automotive & Manufacturing</option>
                <option value="Semiconductors & VLSI">Semiconductors & VLSI</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Operating Location / Office <span className="text-rose-500">*</span>
              </label>
              <input
                id="company-location-input"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Bengaluru / Hyderabad / Pune"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white ${
                  formErrors.location
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {formErrors.location && (
                <p className="mt-1 text-xs text-rose-500">{formErrors.location}</p>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                HR / University Contact Person <span className="text-rose-500">*</span>
              </label>
              <input
                id="company-contact-person-input"
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="e.g. Priya Nambiar (Campus Head)"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white ${
                  formErrors.contact_person
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {formErrors.contact_person && (
                <p className="mt-1 text-xs text-rose-500">{formErrors.contact_person}</p>
              )}
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                HR Contact Email <span className="text-rose-500">*</span>
              </label>
              <input
                id="company-contact-email-input"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="campus-recruitment@company.com"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white ${
                  formErrors.contact_email
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {formErrors.contact_email && (
                <p className="mt-1 text-xs text-rose-500">{formErrors.contact_email}</p>
              )}
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Company Careers Website URL
            </label>
            <input
              id="company-website-input"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://company.com/careers"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              to="/companies"
              className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              id="company-save-btn"
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEditMode ? 'Update Company' : 'Save Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
