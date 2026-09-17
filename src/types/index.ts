export type Role = 'admin' | 'student' | 'recruiter';
export type PlacementStatus = 'Not Placed' | 'Placed' | 'Not Eligible';
export type DriveStatus = 'Upcoming' | 'Active' | 'Closed';
export type ApplicationStatus = 'Applied' | 'Shortlisted' | 'Rejected' | 'Selected';

export interface User {
  id: number;
  username: string;
  role: Role;
  name: string;
  email: string;
  linked_student_id: number | null;
  linked_company_id: number | null;
}

export interface Student {
  id: number;
  student_id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  year: number;
  cgpa: number;
  skills: string;
  backlogs: number;
  placement_status: PlacementStatus;
  created_at: string;
  updated_at: string;
  applications?: Application[];
}

export interface Company {
  id: number;
  company_id: string;
  company_name: string;
  industry: string;
  website: string;
  location: string;
  contact_person: string;
  contact_email: string;
  created_at: string;
  updated_at: string;
  drives_count?: number;
  total_applicants?: number;
  drives?: PlacementDrive[];
}

export interface PlacementDrive {
  id: number;
  company_id: number;
  company_name?: string;
  industry?: string;
  company_website?: string;
  company_headquarters?: string;
  contact_person?: string;
  contact_email?: string;
  job_role: string;
  package: string;
  minimum_cgpa: number;
  allowed_departments: string;
  eligible_branches?: string;
  eligible_batches?: string;
  maximum_backlogs: number;
  max_backlogs?: number;
  drive_date: string;
  application_deadline?: string;
  location?: string;
  description?: string;
  job_description?: string;
  status: DriveStatus;
  applicants_count?: number;
  applications_count?: number;
  created_at?: string;
  updated_at?: string;
  my_application?: Application | null;
  my_eligibility?: EligibilityResult | null;
  applications?: Application[];
}

export interface Application {
  id: number;
  student_id: number;
  placement_drive_id: number;
  application_date?: string;
  applied_date?: string;
  status: ApplicationStatus;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  // Join fields
  student_name?: string;
  student_code?: string;
  student_id_code?: string;
  student_email?: string;
  student_phone?: string;
  student_department?: string;
  student_dept?: string;
  student_cgpa?: number;
  student_skills?: string;
  student_backlogs?: number;
  student_placement_status?: PlacementStatus;
  job_role?: string;
  package?: string;
  drive_date?: string;
  company_name?: string;
  industry?: string;
  company_id?: number;
}

export interface EligibilityCriterionCheck {
  criterion: string;
  passed: boolean;
  reason: string;
}

export interface EligibilityResult {
  isEligible: boolean;
  student?: {
    id: number;
    name: string;
    student_id: string;
    cgpa: number;
    department: string;
    backlogs: number;
  };
  criteria?: {
    minimum_cgpa: number;
    allowed_departments: string[];
    maximum_backlogs: number;
  };
  checks?: {
    cgpa: { passed: boolean; value: number; required: number; message: string };
    department: { passed: boolean; value: string; allowed: string[]; message: string };
    backlogs: { passed: boolean; value: number; maxAllowed: number; message: string };
  };
  reasons: (string | EligibilityCriterionCheck)[];
  hasAlreadyApplied?: boolean;
  existingApplication?: Application | null;
}

export interface DashboardStats {
  summary: {
    total_students: number;
    total_companies: number;
    active_drives: number;
    total_drives: number;
    total_applications: number;
    total_selected: number;
    total_placed: number;
    total_not_placed: number;
    total_not_eligible: number;
    placement_percentage: number;
  };
  department_breakdown: {
    department: string;
    total: number;
    placed: number;
  }[];
  application_status_distribution: {
    status: ApplicationStatus;
    count: number;
  }[];
  recent_drives: {
    id: number;
    job_role: string;
    package: string;
    drive_date: string;
    status: DriveStatus;
    company_name: string;
    location: string;
  }[];
  recent_applications: {
    id: number;
    status: ApplicationStatus;
    application_date: string;
    student_name: string;
    student_id: string;
    job_role: string;
    company_name: string;
  }[];
}

export interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  results: T[];
}
