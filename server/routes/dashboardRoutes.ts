import { Router, Response } from 'express';
import { queryAll, queryOne } from '../db.js';
import { authenticate, AuthenticatedRequest } from '../auth.js';

const router = Router();

// GET /api/dashboard/stats/ - Real Calculated Statistics
router.get('/stats', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Total Students
    const totalStudentsRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM students');
    const totalStudents = totalStudentsRow?.count || 0;

    // 2. Total Companies
    const totalCompaniesRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM companies');
    const totalCompanies = totalCompaniesRow?.count || 0;

    // 3. Active Drives
    const activeDrivesRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM placement_drives WHERE status = "Active"');
    const activeDrives = activeDrivesRow?.count || 0;

    // Total Drives
    const totalDrivesRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM placement_drives');
    const totalDrives = totalDrivesRow?.count || 0;

    // 4. Total Applications
    const totalApplicationsRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM applications');
    const totalApplications = totalApplicationsRow?.count || 0;

    // 5. Total Selected Applications
    const selectedAppsRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM applications WHERE status = "Selected"');
    const totalSelected = selectedAppsRow?.count || 0;

    // 6. Total Placed Students (from students table)
    const placedStudentsRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM students WHERE placement_status = "Placed"');
    const totalPlaced = placedStudentsRow?.count || 0;

    // 7. Not Placed & Not Eligible counts
    const notPlacedStudentsRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM students WHERE placement_status = "Not Placed"');
    const notPlaced = notPlacedStudentsRow?.count || 0;

    const notEligibleRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM students WHERE placement_status = "Not Eligible"');
    const notEligible = notEligibleRow?.count || 0;

    // 8. Placement Percentage (calculated from database)
    const placementPercentage = totalStudents > 0 ? parseFloat(((totalPlaced / totalStudents) * 100).toFixed(1)) : 0.0;

    // 9. Department-wise breakdown
    const departmentStats = queryAll<{ department: string; total: number; placed: number }>(
      `SELECT department,
              COUNT(*) as total,
              SUM(CASE WHEN placement_status = 'Placed' THEN 1 ELSE 0 END) as placed
       FROM students
       GROUP BY department
       ORDER BY total DESC`
    );

    // 10. Recent placement drives
    const recentDrives = queryAll(
      `SELECT d.id, d.job_role, d.package, d.drive_date, d.status, c.company_name, c.location
       FROM placement_drives d
       JOIN companies c ON d.company_id = c.id
       ORDER BY d.created_at DESC
       LIMIT 5`
    );

    // 11. Recent applications
    const recentApplications = queryAll(
      `SELECT a.id, a.status, a.application_date, s.name as student_name, s.student_id, d.job_role, c.company_name
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN placement_drives d ON a.placement_drive_id = d.id
       JOIN companies c ON d.company_id = c.id
       ORDER BY a.created_at DESC
       LIMIT 5`
    );

    // 12. Application status distribution
    const statusCounts = queryAll<{ status: string; count: number }>(
      `SELECT status, COUNT(*) as count FROM applications GROUP BY status`
    );

    return res.status(200).json({
      summary: {
        total_students: totalStudents,
        total_companies: totalCompanies,
        active_drives: activeDrives,
        total_drives: totalDrives,
        total_applications: totalApplications,
        total_selected: totalSelected,
        total_placed: totalPlaced,
        total_not_placed: notPlaced,
        total_not_eligible: notEligible,
        placement_percentage: placementPercentage
      },
      department_breakdown: departmentStats,
      application_status_distribution: statusCounts,
      recent_drives: recentDrives,
      recent_applications: recentApplications
    });
  } catch (error: any) {
    console.error('Error calculating dashboard statistics:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

export default router;
