import { Request, Response, NextFunction } from 'express';
import { queryOne } from './db.js';

export interface AuthUser {
  id: number;
  username: string;
  role: 'admin' | 'student' | 'recruiter';
  name: string;
  email: string;
  linked_student_id: number | null;
  linked_company_id: number | null;
}

// In-memory token store mapped to user
const tokenSessions = new Map<string, { user: AuthUser; expiresAt: number }>();

export function createTokenForUser(user: AuthUser): string {
  const token = `cpms_token_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  // 7-day expiration
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  tokenSessions.set(token, { user, expiresAt });
  return token;
}

export function getUserByToken(token: string): AuthUser | null {
  if (!token) return null;
  const session = tokenSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    tokenSessions.delete(token);
    return null;
  }
  return session.user;
}

export function revokeToken(token: string): void {
  tokenSessions.delete(token);
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token required. Please provide Authorization: Bearer <token> header.'
    });
  }

  const token = authHeader.substring(7).trim();
  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({
      error: 'Invalid or Expired Token',
      message: 'Session has expired or token is invalid. Please log in again.'
    });
  }

  req.user = user;
  next();
}

export function requireRole(allowedRoles: ('admin' | 'student' | 'recruiter')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource. Allowed roles: ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
}
