import { Router, Response } from 'express';
import { queryAll, queryOne, runQuery } from '../db.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Email format regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/students/ - List with Search, Filtering & Pagination
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      search = '',
      department = '',
      year = '',
      placement_status = '',
      sort_by = 'name',
      sort_order = 'ASC',
      page = '1',
      page_size = '10'
    } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      const searchTerm = `%${String(search).trim()}%`;
      conditions.push('(name LIKE ? OR student_id LIKE ? OR email LIKE ? OR skills LIKE ?)');
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (department && department !== 'All') {
      conditions.push('department = ?');
      params.push(String(department));
    }

    if (year && year !== 'All') {
      conditions.push('year = ?');
      params.push(parseInt(String(year), 10));
    }

    if (placement_status && placement_status !== 'All') {
      conditions.push('placement_status = ?');
      params.push(String(placement_status));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count query
    const countResult = queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM students ${whereClause}`,
      params
    );
    const totalCount = countResult?.total || 0;

    // Sorting safe whitelist
    const allowedSortFields: Record<string, string> = {
      name: 'name',
      student_id: 'student_id',
      cgpa: 'cgpa',
      year: 'year',
      department: 'department',
      created_at: 'created_at'
    };
    const sortField = allowedSortFields[String(sort_by)] || 'name';
    const order = String(sort_order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Pagination
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(page_size), 10) || 10));
    const offset = (pageNum - 1) * limit;

    const listParams = [...params, limit, offset];
    const students = queryAll(
      `SELECT * FROM students ${whereClause} ORDER BY ${sortField} ${order} LIMIT ? OFFSET ?`,
      listParams
    );

    return res.status(200).json({
      count: totalCount,
      total_pages: Math.ceil(totalCount / limit),
      current_page: pageNum,
      page_size: limit,
      results: students
    });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/students/:id/ - Details with application history
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'Student ID must be a valid integer' });
    }

    const student = queryOne('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ error: 'Not Found', message: `Student with ID ${studentId} not found` });
    }

    // Role check: Students can only view their own profile unless admin/recruiter
    if (req.user?.role === 'student' && req.user.linked_student_id !== studentId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to view this student profile.' });
    }

    // Fetch student's applications
    const applications = queryAll(
      `SELECT a.*, d.job_role, d.package, d.drive_date, c.company_name, c.location as company_location
       FROM applications a
       JOIN placement_drives d ON a.placement_drive_id = d.id
       JOIN companies c ON d.company_id = c.id
       WHERE a.student_id = ?
       ORDER BY a.created_at DESC`,
      [studentId]
    );

    return res.status(200).json({
      ...student,
      applications
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/students/ - Add Student (Admin Only)
router.post('/', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      student_id,
      name,
      email,
      phone,
      department,
      year,
      cgpa,
      skills = '',
      backlogs = 0,
      placement_status = 'Not Placed'
    } = req.body;

    // Validation
    const errors: Record<string, string> = {};

    if (!student_id || !student_id.toString().trim()) {
      errors.student_id = 'Student ID is required.';
    }
    if (!name || !name.toString().trim()) {
      errors.name = 'Student Name is required.';
    }
    if (!email || !EMAIL_REGEX.test(email.toString().trim())) {
      errors.email = 'A valid email address is required.';
    }
    if (!phone || !phone.toString().trim()) {
      errors.phone = 'Contact phone number is required.';
    }
    if (!department || !department.toString().trim()) {
      errors.department = 'Department is required.';
    }

    const numYear = parseInt(year, 10);
    if (isNaN(numYear) || numYear < 1 || numYear > 5) {
      errors.year = 'Year must be a valid number between 1 and 5.';
    }

    const numCgpa = parseFloat(cgpa);
    if (isNaN(numCgpa) || numCgpa < 0.0 || numCgpa > 10.0) {
      errors.cgpa = 'CGPA must be a valid number between 0.0 and 10.0.';
    }

    const numBacklogs = parseInt(backlogs, 10);
    if (isNaN(numBacklogs) || numBacklogs < 0) {
      errors.backlogs = 'Backlogs cannot be negative.';
    }

    const validStatuses = ['Not Placed', 'Placed', 'Not Eligible'];
    if (placement_status && !validStatuses.includes(placement_status)) {
      errors.placement_status = 'Invalid placement status. Must be Not Placed, Placed, or Not Eligible.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please resolve validation errors before submitting.',
        details: errors
      });
    }

    // Check uniqueness of student_id and email
    const existingId = queryOne('SELECT id FROM students WHERE student_id = ?', [student_id.toString().trim()]);
    if (existingId) {
      return res.status(409).json({
        error: 'Duplicate Student ID',
        message: `Student ID '${student_id}' already exists in the system.`
      });
    }

    const existingEmail = queryOne('SELECT id FROM students WHERE email = ?', [email.toString().trim().toLowerCase()]);
    if (existingEmail) {
      return res.status(409).json({
        error: 'Duplicate Email',
        message: `Email '${email}' is already registered with another student.`
      });
    }

    // Insert student
    const result = runQuery(
      `INSERT INTO students (student_id, name, email, phone, department, year, cgpa, skills, backlogs, placement_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_id.toString().trim().toUpperCase(),
        name.toString().trim(),
        email.toString().trim().toLowerCase(),
        phone.toString().trim(),
        department.toString().trim().toUpperCase(),
        numYear,
        numCgpa,
        skills.toString().trim(),
        numBacklogs,
        placement_status
      ]
    );

    const newStudentId = result.lastInsertRowid;
    const newStudent = queryOne('SELECT * FROM students WHERE id = ?', [newStudentId]);

    // Create user login account for the student
    const username = student_id.toString().trim().toUpperCase();
    const existingUser = queryOne('SELECT id FROM users WHERE username = ?', [username]);
    if (!existingUser) {
      runQuery(
        `INSERT INTO users (username, password, role, name, email, linked_student_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [username, 'student123', 'student', name.toString().trim(), email.toString().trim().toLowerCase(), newStudentId]
      );
    }

    return res.status(201).json({
      message: 'Student registered successfully',
      student: newStudent
    });
  } catch (error: any) {
    console.error('Error creating student:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// PUT/PATCH /api/students/:id/ - Update Student
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'Student ID must be a valid integer' });
    }

    const existing = queryOne<any>('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: `Student with ID ${studentId} not found` });
    }

    // Check permissions: Student can only edit their own phone and skills
    const isAdmin = req.user?.role === 'admin';
    const isSelfStudent = req.user?.role === 'student' && req.user.linked_student_id === studentId;

    if (!isAdmin && !isSelfStudent) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to update this student.' });
    }

    const {
      student_id = existing.student_id,
      name = existing.name,
      email = existing.email,
      phone = existing.phone,
      department = existing.department,
      year = existing.year,
      cgpa = existing.cgpa,
      skills = existing.skills,
      backlogs = existing.backlogs,
      placement_status = existing.placement_status
    } = req.body;

    // Student self-update restricts academic/system fields
    const updatedName = isAdmin ? name.toString().trim() : existing.name;
    const updatedStudentId = isAdmin ? student_id.toString().trim().toUpperCase() : existing.student_id;
    const updatedEmail = isAdmin ? email.toString().trim().toLowerCase() : existing.email;
    const updatedPhone = phone.toString().trim();
    const updatedDept = isAdmin ? department.toString().trim().toUpperCase() : existing.department;
    const updatedYear = isAdmin ? parseInt(year, 10) : existing.year;
    const updatedCgpa = isAdmin ? parseFloat(cgpa) : existing.cgpa;
    const updatedSkills = skills.toString().trim();
    const updatedBacklogs = isAdmin ? parseInt(backlogs, 10) : existing.backlogs;
    const updatedStatus = isAdmin ? placement_status : existing.placement_status;

    // Validate email
    if (!EMAIL_REGEX.test(updatedEmail)) {
      return res.status(400).json({ error: 'Validation Error', message: 'Invalid email address.' });
    }

    // Validate CGPA
    if (isNaN(updatedCgpa) || updatedCgpa < 0.0 || updatedCgpa > 10.0) {
      return res.status(400).json({ error: 'Validation Error', message: 'CGPA must be between 0.0 and 10.0' });
    }

    // Validate backlogs
    if (isNaN(updatedBacklogs) || updatedBacklogs < 0) {
      return res.status(400).json({ error: 'Validation Error', message: 'Backlogs cannot be negative' });
    }

    // Uniqueness checks if changed
    if (isAdmin && updatedStudentId !== existing.student_id) {
      const dup = queryOne('SELECT id FROM students WHERE student_id = ? AND id != ?', [updatedStudentId, studentId]);
      if (dup) {
        return res.status(409).json({ error: 'Conflict', message: `Student ID ${updatedStudentId} is already in use.` });
      }
    }

    if (isAdmin && updatedEmail !== existing.email) {
      const dup = queryOne('SELECT id FROM students WHERE email = ? AND id != ?', [updatedEmail, studentId]);
      if (dup) {
        return res.status(409).json({ error: 'Conflict', message: `Email ${updatedEmail} is already registered.` });
      }
    }

    runQuery(
      `UPDATE students
       SET student_id = ?, name = ?, email = ?, phone = ?, department = ?, year = ?, cgpa = ?, skills = ?, backlogs = ?, placement_status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        updatedStudentId,
        updatedName,
        updatedEmail,
        updatedPhone,
        updatedDept,
        updatedYear,
        updatedCgpa,
        updatedSkills,
        updatedBacklogs,
        updatedStatus,
        studentId
      ]
    );

    const updated = queryOne('SELECT * FROM students WHERE id = ?', [studentId]);
    return res.status(200).json({ message: 'Student updated successfully', student: updated });
  } catch (error: any) {
    console.error('Error updating student:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// DELETE /api/students/:id/ - Delete Student (Admin Only)
router.delete('/:id', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'Student ID must be a valid integer' });
    }

    const student = queryOne<any>('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ error: 'Not Found', message: `Student with ID ${studentId} not found` });
    }

    // Delete associated applications
    runQuery('DELETE FROM applications WHERE student_id = ?', [studentId]);
    // Delete user login account if linked
    runQuery('DELETE FROM users WHERE linked_student_id = ?', [studentId]);
    // Delete student
    runQuery('DELETE FROM students WHERE id = ?', [studentId]);

    return res.status(200).json({
      message: `Student '${student.name}' (${student.student_id}) deleted successfully.`
    });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

export default router;
