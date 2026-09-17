import { Router, Response } from 'express';
import { queryAll, queryOne, runQuery } from '../db.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth.js';

const router = Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/companies/ - List Companies with Search and Filter
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search = '', industry = '', location = '' } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      const searchTerm = `%${String(search).trim()}%`;
      conditions.push('(c.company_name LIKE ? OR c.company_id LIKE ? OR c.location LIKE ? OR c.contact_person LIKE ?)');
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (industry && industry !== 'All') {
      conditions.push('c.industry = ?');
      params.push(String(industry));
    }

    if (location && location !== 'All') {
      conditions.push('c.location LIKE ?');
      params.push(`%${String(location)}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const companies = queryAll(
      `SELECT c.*, 
              COUNT(DISTINCT d.id) as drives_count,
              COUNT(DISTINCT a.id) as total_applicants
       FROM companies c
       LEFT JOIN placement_drives d ON c.id = d.company_id
       LEFT JOIN applications a ON d.id = a.placement_drive_id
       ${whereClause}
       GROUP BY c.id
       ORDER BY c.company_name ASC`,
      params
    );

    return res.status(200).json({ count: companies.length, results: companies });
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/companies/:id/ - Details with Drives
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = parseInt(req.params.id, 10);
    if (isNaN(companyId)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'Company ID must be an integer' });
    }

    const company = queryOne('SELECT * FROM companies WHERE id = ?', [companyId]);
    if (!company) {
      return res.status(404).json({ error: 'Not Found', message: `Company with ID ${companyId} not found` });
    }

    const drives = queryAll(
      `SELECT d.*, COUNT(a.id) as applicants_count
       FROM placement_drives d
       LEFT JOIN applications a ON d.id = a.placement_drive_id
       WHERE d.company_id = ?
       GROUP BY d.id
       ORDER BY d.drive_date DESC`,
      [companyId]
    );

    return res.status(200).json({
      ...company,
      drives
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/companies/ - Create Company (Admin Only)
router.post('/', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      company_id,
      company_name,
      industry,
      website = '',
      location,
      contact_person,
      contact_email
    } = req.body;

    const errors: Record<string, string> = {};

    if (!company_id || !company_id.toString().trim()) {
      errors.company_id = 'Company ID is required.';
    }
    if (!company_name || !company_name.toString().trim()) {
      errors.company_name = 'Company Name is required.';
    }
    if (!industry || !industry.toString().trim()) {
      errors.industry = 'Industry category is required.';
    }
    if (!location || !location.toString().trim()) {
      errors.location = 'Location is required.';
    }
    if (!contact_person || !contact_person.toString().trim()) {
      errors.contact_person = 'Contact Person is required.';
    }
    if (!contact_email || !EMAIL_REGEX.test(contact_email.toString().trim())) {
      errors.contact_email = 'Valid contact email is required.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please resolve form errors before submitting.',
        details: errors
      });
    }

    // Check unique company_id
    const existing = queryOne('SELECT id FROM companies WHERE company_id = ?', [company_id.toString().trim()]);
    if (existing) {
      return res.status(409).json({
        error: 'Duplicate Company ID',
        message: `Company ID '${company_id}' already exists.`
      });
    }

    const result = runQuery(
      `INSERT INTO companies (company_id, company_name, industry, website, location, contact_person, contact_email)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        company_id.toString().trim().toUpperCase(),
        company_name.toString().trim(),
        industry.toString().trim(),
        website.toString().trim(),
        location.toString().trim(),
        contact_person.toString().trim(),
        contact_email.toString().trim().toLowerCase()
      ]
    );

    const newCompany = queryOne('SELECT * FROM companies WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json({ message: 'Company created successfully', company: newCompany });
  } catch (error: any) {
    console.error('Error adding company:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// PUT/PATCH /api/companies/:id/ - Edit Company
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = parseInt(req.params.id, 10);
    if (isNaN(companyId)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'Company ID must be an integer' });
    }

    const existing = queryOne<any>('SELECT * FROM companies WHERE id = ?', [companyId]);
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: `Company with ID ${companyId} not found` });
    }

    // Authorization: Admin or recruiter linked to this company
    const isAdmin = req.user?.role === 'admin';
    const isLinkedRecruiter = req.user?.role === 'recruiter' && req.user.linked_company_id === companyId;

    if (!isAdmin && !isLinkedRecruiter) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to update this company.' });
    }

    const {
      company_id = existing.company_id,
      company_name = existing.company_name,
      industry = existing.industry,
      website = existing.website,
      location = existing.location,
      contact_person = existing.contact_person,
      contact_email = existing.contact_email
    } = req.body;

    const trimmedCompanyId = company_id.toString().trim().toUpperCase();
    const trimmedEmail = contact_email.toString().trim().toLowerCase();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Validation Error', message: 'Valid contact email is required.' });
    }

    // Check unique company_id if changed
    if (trimmedCompanyId !== existing.company_id) {
      const dup = queryOne('SELECT id FROM companies WHERE company_id = ? AND id != ?', [trimmedCompanyId, companyId]);
      if (dup) {
        return res.status(409).json({ error: 'Conflict', message: `Company ID '${trimmedCompanyId}' is already in use.` });
      }
    }

    runQuery(
      `UPDATE companies
       SET company_id = ?, company_name = ?, industry = ?, website = ?, location = ?, contact_person = ?, contact_email = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        trimmedCompanyId,
        company_name.toString().trim(),
        industry.toString().trim(),
        website.toString().trim(),
        location.toString().trim(),
        contact_person.toString().trim(),
        trimmedEmail,
        companyId
      ]
    );

    const updated = queryOne('SELECT * FROM companies WHERE id = ?', [companyId]);
    return res.status(200).json({ message: 'Company updated successfully', company: updated });
  } catch (error: any) {
    console.error('Error updating company:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// DELETE /api/companies/:id/ - Delete Company (Admin Only)
router.delete('/:id', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = parseInt(req.params.id, 10);
    if (isNaN(companyId)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'Company ID must be an integer' });
    }

    const company = queryOne<any>('SELECT * FROM companies WHERE id = ?', [companyId]);
    if (!company) {
      return res.status(404).json({ error: 'Not Found', message: `Company with ID ${companyId} not found` });
    }

    // Delete associated placement drives and applications
    const driveIds = queryAll<{ id: number }>('SELECT id FROM placement_drives WHERE company_id = ?', [companyId]);
    for (const d of driveIds) {
      runQuery('DELETE FROM applications WHERE placement_drive_id = ?', [d.id]);
    }
    runQuery('DELETE FROM placement_drives WHERE company_id = ?', [companyId]);
    runQuery('DELETE FROM companies WHERE id = ?', [companyId]);

    return res.status(200).json({ message: `Company '${company.company_name}' deleted successfully.` });
  } catch (error: any) {
    console.error('Error deleting company:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

export default router;
