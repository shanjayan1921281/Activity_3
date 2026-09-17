import { Router, Response } from 'express';
import { queryAll, queryOne, runQuery } from '../db.js';
import { authenticate, AuthenticatedRequest } from '../auth.js';
import { evaluateStudentEligibility } from './driveRoutes.js';

const router = Router();

// GET /api/applications/ - List Applications with Filters
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      student_id = '',
      placement_drive_id = '',
      company_id = '',
      status = '',
      search = ''
    } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];

    // Role enforcement: If student, restrict to their own applications
    if (req.user?.role === 'student') {
      if (!req.user.linked_student_id) {
        return res.status(403).json({ error: 'Forbidden', message: 'No student profile linked.' });
      }
      conditions.push('a.student_id = ?');
      params.push(req.user.linked_student_id);
    } else if (student_id && student_id !== 'All') {
      conditions.push('a.student_id = ?');
      params.push(parseInt(String(student_id), 10));
    }

    // Recruiter enforcement: restrict to their company's drives
    if (req.user?.role === 'recruiter') {
      if (!req.user.linked_company_id) {
        return res.status(403).json({ error: 'Forbidden', message: 'No company linked to recruiter.' });
      }
      conditions.push('d.company_id = ?');
      params.push(req.user.linked_company_id);
    } else if (company_id && company_id !== 'All') {
      conditions.push('d.company_id = ?');
      params.push(parseInt(String(company_id), 10));
    }

    if (placement_drive_id && placement_drive_id !== 'All') {
      conditions.push('a.placement_drive_id = ?');
      params.push(parseInt(String(placement_drive_id), 10));
    }

    if (status && status !== 'All') {
      conditions.push('a.status = ?');
      params.push(String(status));
    }

    if (search) {
      const term = `%${String(search).trim()}%`;
      conditions.push('(s.name LIKE ? OR s.student_id LIKE ? OR c.company_name LIKE ? OR d.job_role LIKE ?)');
      params.push(term, term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const applications = queryAll(
      `SELECT a.*,
              s.student_id as student_code,
              s.name as student_name,
              s.email as student_email,
              s.phone as student_phone,
              s.department as student_department,
              s.cgpa as student_cgpa,
              s.skills as student_skills,
              s.backlogs as student_backlogs,
              s.placement_status as student_placement_status,
              d.job_role,
              d.package,
              d.drive_date,
              d.location as drive_location,
              d.status as drive_status,
              c.id as company_id,
              c.company_name,
              c.industry
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN placement_drives d ON a.placement_drive_id = d.id
       JOIN companies c ON d.company_id = c.id
       ${whereClause}
       ORDER BY a.created_at DESC`,
      params
    );

    return res.status(200).json({ count: applications.length, results: applications });
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/applications/:id/ - Details
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const appId = parseInt(req.params.id, 10);
    if (isNaN(appId)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'Application ID must be an integer' });
    }

    const application = queryOne(
      `SELECT a.*,
              s.student_id as student_code,
              s.name as student_name,
              s.email as student_email,
              s.phone as student_phone,
              s.department as student_department,
              s.cgpa as student_cgpa,
              s.skills as student_skills,
              s.backlogs as student_backlogs,
              s.placement_status as student_placement_status,
              d.job_role,
              d.package,
              d.drive_date,
              d.minimum_cgpa,
              d.allowed_departments,
              d.maximum_backlogs,
              c.company_name,
              c.industry,
              c.contact_person,
              c.contact_email
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN placement_drives d ON a.placement_drive_id = d.id
       JOIN companies c ON d.company_id = c.id
       WHERE a.id = ?`,
      [appId]
    );

    if (!application) {
      return res.status(404).json({ error: 'Not Found', message: `Application ${appId} not found` });
    }

    // Security check for student
    if (req.user?.role === 'student' && req.user.linked_student_id !== application.student_id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied.' });
    }

    return res.status(200).json(application);
  } catch (error: any) {
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/applications/ - Create Application
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    let { student_id, placement_drive_id, remarks = '' } = req.body;

    // If student role, force their own student id
    if (req.user?.role === 'student') {
      if (!req.user.linked_student_id) {
        return res.status(403).json({ error: 'Forbidden', message: 'No student profile linked to your account.' });
      }
      student_id = req.user.linked_student_id;
    }

    const sId = parseInt(student_id, 10);
    const dId = parseInt(placement_drive_id, 10);

    if (isNaN(sId) || isNaN(dId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid student_id and placement_drive_id are required.'
      });
    }

    // 1. Verify Student exists
    const student = queryOne('SELECT * FROM students WHERE id = ?', [sId]);
    if (!student) {
      return res.status(404).json({ error: 'Not Found', message: `Student ${sId} not found in database.` });
    }

    // 2. Verify Drive exists
    const drive = queryOne('SELECT * FROM placement_drives WHERE id = ?', [dId]);
    if (!drive) {
      return res.status(404).json({ error: 'Not Found', message: `Placement Drive ${dId} not found.` });
    }

    // 3. Check Drive status
    if (drive.status === 'Closed') {
      return res.status(400).json({
        error: 'Drive Closed',
        message: 'Applications for this placement drive are closed.'
      });
    }

    // 4. Prevent duplicate application
    const existing = queryOne('SELECT id FROM applications WHERE student_id = ? AND placement_drive_id = ?', [sId, dId]);
    if (existing) {
      return res.status(409).json({
        error: 'Duplicate Application',
        message: 'Application already submitted. You have already applied for this placement drive.'
      });
    }

    // 5. Evaluate Eligibility
    const eligibility = evaluateStudentEligibility(student, drive);
    if (!eligibility.isEligible) {
      return res.status(400).json({
        error: 'Ineligible Applicant',
        message: 'Student does not meet the eligibility criteria for this placement drive.',
        details: eligibility.reasons,
        eligibility
      });
    }

    // 6. Insert Application
    const result = runQuery(
      `INSERT INTO applications (student_id, placement_drive_id, status, remarks)
       VALUES (?, ?, 'Applied', ?)`,
      [sId, dId, remarks.toString().trim() || 'Application submitted via student portal.']
    );

    const newApp = queryOne(
      `SELECT a.*, s.name as student_name, s.student_id as student_code, d.job_role, c.company_name
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN placement_drives d ON a.placement_drive_id = d.id
       JOIN companies c ON d.company_id = c.id
       WHERE a.id = ?`,
      [result.lastInsertRowid]
    );

    return res.status(201).json({
      message: 'Application submitted successfully!',
      application: newApp
    });
  } catch (error: any) {
    console.error('Error submitting application:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// PUT/PATCH /api/applications/:id/ - Update Application Status & Remarks (Admin or Recruiter)
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const appId = parseInt(req.params.id, 10);
    if (isNaN(appId)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'Application ID must be an integer' });
    }

    const app = queryOne<any>(
      `SELECT a.*, d.company_id, s.id as student_id_val, s.name as student_name
       FROM applications a
       JOIN placement_drives d ON a.placement_drive_id = d.id
       JOIN students s ON a.student_id = s.id
       WHERE a.id = ?`,
      [appId]
    );

    if (!app) {
      return res.status(404).json({ error: 'Not Found', message: `Application ${appId} not found` });
    }

    // Role check: Only admin or assigned recruiter can change status
    const isAdmin = req.user?.role === 'admin';
    const isRecruiter = req.user?.role === 'recruiter' && req.user.linked_company_id === app.company_id;

    if (!isAdmin && !isRecruiter) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to update this application.' });
    }

    const { status = app.status, remarks = app.remarks } = req.body;

    const validStatuses = ['Applied', 'Shortlisted', 'Rejected', 'Selected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    runQuery(
      `UPDATE applications
       SET status = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, remarks.toString().trim(), appId]
    );

    // CRITICAL: When status becomes 'Selected', automatically update student's placement_status to 'Placed'!
    if (status === 'Selected') {
      runQuery(
        `UPDATE students
         SET placement_status = 'Placed', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [app.student_id_val]
      );
      console.log(`[Placement System] Student ${app.student_name} (ID: ${app.student_id_val}) marked as Placed!`);
    }

    const updated = queryOne(
      `SELECT a.*, s.name as student_name, s.student_id as student_code, s.placement_status, d.job_role, c.company_name
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN placement_drives d ON a.placement_drive_id = d.id
       JOIN companies c ON d.company_id = c.id
       WHERE a.id = ?`,
      [appId]
    );

    return res.status(200).json({
      message: `Application status updated to '${status}'.`,
      application: updated
    });
  } catch (error: any) {
    console.error('Error updating application:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// DELETE /api/applications/:id/ - Withdraw or delete application
router.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const appId = parseInt(req.params.id, 10);
    if (isNaN(appId)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'Application ID must be an integer' });
    }

    const app = queryOne<any>('SELECT * FROM applications WHERE id = ?', [appId]);
    if (!app) {
      return res.status(404).json({ error: 'Not Found', message: `Application ${appId} not found` });
    }

    // Role check: Admin or the student themselves
    const isAdmin = req.user?.role === 'admin';
    const isSelfStudent = req.user?.role === 'student' && req.user.linked_student_id === app.student_id;

    if (!isAdmin && !isSelfStudent) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to withdraw this application.' });
    }

    runQuery('DELETE FROM applications WHERE id = ?', [appId]);

    return res.status(200).json({ message: 'Application removed successfully.' });
  } catch (error: any) {
    console.error('Error deleting application:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

export default router;
