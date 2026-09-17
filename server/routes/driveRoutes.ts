import { Router, Response } from 'express';
import { queryAll, queryOne, runQuery } from '../db.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth.js';

const router = Router();

export interface EligibilityResult {
  isEligible: boolean;
  student: {
    id: number;
    name: string;
    student_id: string;
    cgpa: number;
    department: string;
    backlogs: number;
  };
  criteria: {
    minimum_cgpa: number;
    allowed_departments: string[];
    maximum_backlogs: number;
  };
  checks: {
    cgpa: { passed: boolean; value: number; required: number; message: string };
    department: { passed: boolean; value: string; allowed: string[]; message: string };
    backlogs: { passed: boolean; value: number; maxAllowed: number; message: string };
  };
  reasons: string[];
}

export function evaluateStudentEligibility(student: any, drive: any): EligibilityResult {
  const allowedDepts = drive.allowed_departments
    .split(',')
    .map((d: string) => d.trim().toUpperCase())
    .filter(Boolean);

  const studentDept = student.department ? student.department.trim().toUpperCase() : '';
  const studentCgpa = parseFloat(student.cgpa);
  const minCgpa = parseFloat(drive.minimum_cgpa);
  const studentBacklogs = parseInt(student.backlogs, 10) || 0;
  const maxBacklogs = parseInt(drive.maximum_backlogs, 10) || 0;

  const cgpaPassed = studentCgpa >= minCgpa;
  const deptPassed = allowedDepts.includes(studentDept) || allowedDepts.includes('ALL');
  const backlogsPassed = studentBacklogs <= maxBacklogs;

  const reasons: string[] = [];
  if (!cgpaPassed) {
    reasons.push(`Student CGPA (${studentCgpa.toFixed(2)}) is below the required minimum (${minCgpa.toFixed(2)})`);
  }
  if (!deptPassed) {
    reasons.push(`Student department '${studentDept}' is not in allowed list (${allowedDepts.join(', ')})`);
  }
  if (!backlogsPassed) {
    reasons.push(`Student has ${studentBacklogs} backlog(s), which exceeds the limit of ${maxBacklogs}`);
  }

  return {
    isEligible: cgpaPassed && deptPassed && backlogsPassed,
    student: {
      id: student.id,
      name: student.name,
      student_id: student.student_id,
      cgpa: studentCgpa,
      department: studentDept,
      backlogs: studentBacklogs
    },
    criteria: {
      minimum_cgpa: minCgpa,
      allowed_departments: allowedDepts,
      maximum_backlogs: maxBacklogs
    },
    checks: {
      cgpa: {
        passed: cgpaPassed,
        value: studentCgpa,
        required: minCgpa,
        message: cgpaPassed
          ? `CGPA ${studentCgpa.toFixed(2)} meets minimum requirement of ${minCgpa.toFixed(2)}`
          : `CGPA ${studentCgpa.toFixed(2)} is below requirement (${minCgpa.toFixed(2)})`
      },
      department: {
        passed: deptPassed,
        value: studentDept,
        allowed: allowedDepts,
        message: deptPassed
          ? `Department ${studentDept} is eligible`
          : `Department ${studentDept} is not eligible (Allowed: ${allowedDepts.join(', ')})`
      },
      backlogs: {
        passed: backlogsPassed,
        value: studentBacklogs,
        maxAllowed: maxBacklogs,
        message: backlogsPassed
          ? `Backlogs (${studentBacklogs}) within acceptable limit (${maxBacklogs})`
          : `Backlogs (${studentBacklogs}) exceed maximum allowed (${maxBacklogs})`
      }
    },
    reasons
  };
}

// GET /api/drives/ - List drives with Search and Filter
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search = '', status = '', department = '', company_id = '' } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      const term = `%${String(search).trim()}%`;
      conditions.push('(d.job_role LIKE ? OR c.company_name LIKE ? OR d.location LIKE ? OR d.description LIKE ?)');
      params.push(term, term, term, term);
    }

    if (status && status !== 'All') {
      conditions.push('d.status = ?');
      params.push(String(status));
    }

    if (company_id && company_id !== 'All') {
      conditions.push('d.company_id = ?');
      params.push(parseInt(String(company_id), 10));
    }

    if (department && department !== 'All') {
      conditions.push('(d.allowed_departments LIKE ? OR d.allowed_departments LIKE "%ALL%")');
      params.push(`%${String(department).trim()}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Join with company and get applicant count
    const drives = queryAll(
      `SELECT d.*,
              c.company_name,
              c.industry,
              c.website as company_website,
              c.location as company_headquarters,
              COUNT(DISTINCT a.id) as applicants_count
       FROM placement_drives d
       JOIN companies c ON d.company_id = c.id
       LEFT JOIN applications a ON d.id = a.placement_drive_id
       ${whereClause}
       GROUP BY d.id
       ORDER BY 
         CASE d.status 
           WHEN 'Active' THEN 1 
           WHEN 'Upcoming' THEN 2 
           ELSE 3 
         END,
         d.drive_date ASC`,
      params
    );

    // If student logged in, attach their application status & eligibility preview
    let studentRecord: any = null;
    if (req.user?.role === 'student' && req.user.linked_student_id) {
      studentRecord = queryOne('SELECT * FROM students WHERE id = ?', [req.user.linked_student_id]);
    }

    const enhancedDrives = drives.map(d => {
      let myApplication = null;
      let eligibility = null;

      if (studentRecord) {
        myApplication = queryOne(
          'SELECT id, status, application_date, remarks FROM applications WHERE student_id = ? AND placement_drive_id = ?',
          [studentRecord.id, d.id]
        );
        eligibility = evaluateStudentEligibility(studentRecord, d);
      }

      return {
        ...d,
        my_application: myApplication,
        my_eligibility: eligibility
      };
    });

    return res.status(200).json({ count: enhancedDrives.length, results: enhancedDrives });
  } catch (error: any) {
    console.error('Error fetching placement drives:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/drives/:id/ - Drive details
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const driveId = parseInt(req.params.id, 10);
    if (isNaN(driveId)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'Placement Drive ID must be an integer' });
    }

    const drive = queryOne(
      `SELECT d.*, c.company_name, c.industry, c.website as company_website, c.location as company_headquarters, c.contact_person, c.contact_email
       FROM placement_drives d
       JOIN companies c ON d.company_id = c.id
       WHERE d.id = ?`,
      [driveId]
    );

    if (!drive) {
      return res.status(404).json({ error: 'Not Found', message: `Placement Drive with ID ${driveId} not found` });
    }

    // Fetch applications for this drive
    const applications = queryAll(
      `SELECT a.*, s.student_id, s.name as student_name, s.email as student_email, s.phone as student_phone, s.department as student_dept, s.cgpa as student_cgpa, s.skills as student_skills, s.backlogs as student_backlogs
       FROM applications a
       JOIN students s ON a.student_id = s.id
       WHERE a.placement_drive_id = ?
       ORDER BY a.created_at DESC`,
      [driveId]
    );

    return res.status(200).json({
      ...drive,
      applications,
      total_applicants: applications.length
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/drives/:id/eligibility/ - Eligibility Check Endpoint
router.get('/:id/eligibility', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const driveId = parseInt(req.params.id, 10);
    if (isNaN(driveId)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'Drive ID must be an integer' });
    }

    const drive = queryOne('SELECT * FROM placement_drives WHERE id = ?', [driveId]);
    if (!drive) {
      return res.status(404).json({ error: 'Not Found', message: `Placement Drive ${driveId} not found` });
    }

    // Target student: either from query param (admin checking) or logged-in student
    let targetStudentId = req.query.student_id ? parseInt(String(req.query.student_id), 10) : null;
    if (!targetStudentId && req.user?.role === 'student') {
      targetStudentId = req.user.linked_student_id;
    }

    if (!targetStudentId) {
      return res.status(400).json({
        error: 'Missing Parameter',
        message: 'Student ID must be specified via ?student_id=... or logged-in student profile.'
      });
    }

    const student = queryOne('SELECT * FROM students WHERE id = ?', [targetStudentId]);
    if (!student) {
      return res.status(404).json({ error: 'Not Found', message: `Student ${targetStudentId} not found` });
    }

    const result = evaluateStudentEligibility(student, drive);

    // Also check if already applied
    const existingApp = queryOne('SELECT * FROM applications WHERE student_id = ? AND placement_drive_id = ?', [
      targetStudentId,
      driveId
    ]);

    return res.status(200).json({
      ...result,
      hasAlreadyApplied: !!existingApp,
      existingApplication: existingApp || null
    });
  } catch (error: any) {
    console.error('Error in eligibility checker:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/drives/ - Create Placement Drive (Admin or Company Recruiter)
router.post('/', authenticate, requireRole(['admin', 'recruiter']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      company_id,
      job_role,
      package: drivePackage,
      minimum_cgpa,
      allowed_departments,
      maximum_backlogs = 0,
      drive_date,
      application_deadline,
      location,
      description = '',
      status = 'Upcoming'
    } = req.body;

    // Recruiter can only create for their linked company
    let targetCompanyId = parseInt(company_id, 10);
    if (req.user?.role === 'recruiter') {
      if (!req.user.linked_company_id) {
        return res.status(403).json({ error: 'Forbidden', message: 'Recruiter account is not linked to any company.' });
      }
      targetCompanyId = req.user.linked_company_id;
    }

    const errors: Record<string, string> = {};

    if (isNaN(targetCompanyId)) {
      errors.company_id = 'Valid Company selection is required.';
    } else {
      const comp = queryOne('SELECT id FROM companies WHERE id = ?', [targetCompanyId]);
      if (!comp) errors.company_id = 'Selected company does not exist in the database.';
    }

    if (!job_role || !job_role.toString().trim()) {
      errors.job_role = 'Job Role is required.';
    }
    if (!drivePackage || !drivePackage.toString().trim()) {
      errors.package = 'Package / Salary details are required (e.g., 10 LPA).';
    }

    const numCgpa = parseFloat(minimum_cgpa);
    if (isNaN(numCgpa) || numCgpa < 0.0 || numCgpa > 10.0) {
      errors.minimum_cgpa = 'Minimum CGPA must be a valid number between 0.0 and 10.0.';
    }

    if (!allowed_departments || !allowed_departments.toString().trim()) {
      errors.allowed_departments = 'At least one allowed department is required (e.g. CSE, IT, AIML).';
    }

    const numBacklogs = parseInt(maximum_backlogs, 10);
    if (isNaN(numBacklogs) || numBacklogs < 0) {
      errors.maximum_backlogs = 'Maximum backlogs must be 0 or greater.';
    }

    if (!drive_date) {
      errors.drive_date = 'Drive Date is required.';
    }
    if (!application_deadline) {
      errors.application_deadline = 'Application Deadline is required.';
    }
    if (!location || !location.toString().trim()) {
      errors.location = 'Location / Mode of Drive is required.';
    }

    const validStatuses = ['Upcoming', 'Active', 'Closed'];
    if (status && !validStatuses.includes(status)) {
      errors.status = 'Invalid status. Must be Upcoming, Active, or Closed.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please resolve form errors before submitting.',
        details: errors
      });
    }

    const result = runQuery(
      `INSERT INTO placement_drives (company_id, job_role, package, minimum_cgpa, allowed_departments, maximum_backlogs, drive_date, application_deadline, location, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        targetCompanyId,
        job_role.toString().trim(),
        drivePackage.toString().trim(),
        numCgpa,
        allowed_departments.toString().trim().toUpperCase(),
        numBacklogs,
        drive_date,
        application_deadline,
        location.toString().trim(),
        description.toString().trim(),
        status
      ]
    );

    const newDrive = queryOne('SELECT * FROM placement_drives WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json({ message: 'Placement drive created successfully', drive: newDrive });
  } catch (error: any) {
    console.error('Error creating placement drive:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// PUT/PATCH /api/drives/:id/ - Edit Drive
router.put('/:id', authenticate, requireRole(['admin', 'recruiter']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const driveId = parseInt(req.params.id, 10);
    if (isNaN(driveId)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'Drive ID must be an integer' });
    }

    const existing = queryOne<any>('SELECT * FROM placement_drives WHERE id = ?', [driveId]);
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: `Drive with ID ${driveId} not found` });
    }

    // Recruiter check
    if (req.user?.role === 'recruiter' && req.user.linked_company_id !== existing.company_id) {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only update drives for your assigned company.' });
    }

    const {
      company_id = existing.company_id,
      job_role = existing.job_role,
      package: drivePackage = existing.package,
      minimum_cgpa = existing.minimum_cgpa,
      allowed_departments = existing.allowed_departments,
      maximum_backlogs = existing.maximum_backlogs,
      drive_date = existing.drive_date,
      application_deadline = existing.application_deadline,
      location = existing.location,
      description = existing.description,
      status = existing.status
    } = req.body;

    const numCgpa = parseFloat(minimum_cgpa);
    if (isNaN(numCgpa) || numCgpa < 0.0 || numCgpa > 10.0) {
      return res.status(400).json({ error: 'Validation Error', message: 'CGPA must be between 0.0 and 10.0' });
    }

    const numBacklogs = parseInt(maximum_backlogs, 10);
    if (isNaN(numBacklogs) || numBacklogs < 0) {
      return res.status(400).json({ error: 'Validation Error', message: 'Backlogs cannot be negative' });
    }

    runQuery(
      `UPDATE placement_drives
       SET company_id = ?, job_role = ?, package = ?, minimum_cgpa = ?, allowed_departments = ?, maximum_backlogs = ?, drive_date = ?, application_deadline = ?, location = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        parseInt(company_id, 10),
        job_role.toString().trim(),
        drivePackage.toString().trim(),
        numCgpa,
        allowed_departments.toString().trim().toUpperCase(),
        numBacklogs,
        drive_date,
        application_deadline,
        location.toString().trim(),
        description.toString().trim(),
        status,
        driveId
      ]
    );

    const updated = queryOne('SELECT * FROM placement_drives WHERE id = ?', [driveId]);
    return res.status(200).json({ message: 'Drive updated successfully', drive: updated });
  } catch (error: any) {
    console.error('Error updating drive:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// DELETE /api/drives/:id/ - Delete Drive (Admin Only)
router.delete('/:id', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const driveId = parseInt(req.params.id, 10);
    if (isNaN(driveId)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'Drive ID must be an integer' });
    }

    const existing = queryOne<any>('SELECT * FROM placement_drives WHERE id = ?', [driveId]);
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: `Drive ${driveId} not found` });
    }

    runQuery('DELETE FROM applications WHERE placement_drive_id = ?', [driveId]);
    runQuery('DELETE FROM placement_drives WHERE id = ?', [driveId]);

    return res.status(200).json({ message: `Placement Drive for '${existing.job_role}' deleted successfully.` });
  } catch (error: any) {
    console.error('Error deleting placement drive:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

export default router;
