import { Router, Response } from 'express';
import { queryOne, runQuery } from '../db.js';
import { createTokenForUser, revokeToken, authenticate, AuthenticatedRequest, AuthUser } from '../auth.js';

const router = Router();

// POST /api/auth/login/
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Username and password are required.'
    });
  }

  const user = queryOne<{
    id: number;
    username: string;
    password: string;
    role: 'admin' | 'student' | 'recruiter';
    name: string;
    email: string;
    linked_student_id: number | null;
    linked_company_id: number | null;
  }>('SELECT * FROM users WHERE username = ?', [username.trim()]);

  if (!user || user.password !== password) {
    return res.status(401).json({
      error: 'Invalid Credentials',
      message: 'Incorrect username or password. Please check your credentials.'
    });
  }

  const authUser: AuthUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    email: user.email,
    linked_student_id: user.linked_student_id,
    linked_company_id: user.linked_company_id
  };

  const token = createTokenForUser(authUser);

  // If student, attach student record
  let studentDetails = null;
  if (user.linked_student_id) {
    studentDetails = queryOne('SELECT * FROM students WHERE id = ?', [user.linked_student_id]);
  }

  // If recruiter, attach company record
  let companyDetails = null;
  if (user.linked_company_id) {
    companyDetails = queryOne('SELECT * FROM companies WHERE id = ?', [user.linked_company_id]);
  }

  return res.status(200).json({
    message: 'Login successful',
    token,
    user: authUser,
    student: studentDetails,
    company: companyDetails
  });
});

// POST /api/auth/logout/
router.post('/logout', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    revokeToken(token);
  }
  return res.status(200).json({ message: 'Logged out successfully' });
});

// GET /api/auth/me/
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let studentDetails = null;
  if (req.user.linked_student_id) {
    studentDetails = queryOne('SELECT * FROM students WHERE id = ?', [req.user.linked_student_id]);
  }

  let companyDetails = null;
  if (req.user.linked_company_id) {
    companyDetails = queryOne('SELECT * FROM companies WHERE id = ?', [req.user.linked_company_id]);
  }

  return res.status(200).json({
    user: req.user,
    student: studentDetails,
    company: companyDetails
  });
});

export default router;
