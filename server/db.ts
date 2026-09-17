import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const DB_FILE_PATH = path.resolve(process.cwd(), 'database.sqlite3');

export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      dbInstance = new SQL.Database(fileBuffer);
      console.log('[Database] Loaded existing SQLite database from', DB_FILE_PATH);
    } catch (err) {
      console.error('[Database] Failed to read existing SQLite file, creating new:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
    console.log('[Database] Initialized new in-memory SQLite database');
  }

  initSchemaAndSeed(dbInstance);
  persistDatabase();
  return dbInstance;
}

export function persistDatabase(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error('[Database] Error saving SQLite database to disk:', err);
  }
}

// SQL Query helper for typed results
export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as T;
    results.push(row);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function runQuery(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  persistDatabase();
  
  // Get last insert ID and changes
  const res = dbInstance.exec('SELECT last_insert_rowid() as id, changes() as chg');
  const lastId = (res[0]?.values[0]?.[0] as number) || 0;
  const changes = (res[0]?.values[0]?.[1] as number) || 0;
  return { changes, lastInsertRowid: lastId };
}

function initSchemaAndSeed(db: Database) {
  // Foreign keys
  db.run('PRAGMA foreign_keys = ON;');

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'student', 'recruiter')),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      linked_student_id INTEGER,
      linked_company_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Students table
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      department TEXT NOT NULL,
      year INTEGER NOT NULL CHECK(year BETWEEN 1 AND 5),
      cgpa REAL NOT NULL CHECK(cgpa BETWEEN 0.0 AND 10.0),
      skills TEXT DEFAULT '',
      backlogs INTEGER NOT NULL DEFAULT 0 CHECK(backlogs >= 0),
      placement_status TEXT NOT NULL DEFAULT 'Not Placed' CHECK(placement_status IN ('Not Placed', 'Placed', 'Not Eligible')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Companies table
  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id TEXT UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      industry TEXT NOT NULL,
      website TEXT DEFAULT '',
      location TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Placement Drives table
  db.run(`
    CREATE TABLE IF NOT EXISTS placement_drives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      job_role TEXT NOT NULL,
      package TEXT NOT NULL,
      minimum_cgpa REAL NOT NULL CHECK(minimum_cgpa BETWEEN 0.0 AND 10.0),
      allowed_departments TEXT NOT NULL,
      maximum_backlogs INTEGER NOT NULL DEFAULT 0 CHECK(maximum_backlogs >= 0),
      drive_date TEXT NOT NULL,
      application_deadline TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Upcoming' CHECK(status IN ('Upcoming', 'Active', 'Closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );
  `);

  // Applications table
  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      placement_drive_id INTEGER NOT NULL,
      application_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'Applied' CHECK(status IN ('Applied', 'Shortlisted', 'Rejected', 'Selected')),
      remarks TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, placement_drive_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (placement_drive_id) REFERENCES placement_drives(id) ON DELETE CASCADE
    );
  `);

  // Seed default data if empty
  const userCount = db.exec('SELECT COUNT(*) FROM users;')[0]?.values[0]?.[0] as number;
  if (userCount === 0) {
    seedDatabase(db);
  }
}

export function seedDatabase(db: Database) {
  console.log('[Database] Seeding realistic college placement data...');

  // 1. Seed Students
  const students = [
    {
      student_id: 'CS202301',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@college.edu',
      phone: '+91 98765 43210',
      department: 'CSE',
      year: 4,
      cgpa: 8.85,
      skills: 'React, Node.js, Python, PostgreSQL, Docker',
      backlogs: 0,
      placement_status: 'Not Placed'
    },
    {
      student_id: 'CS202302',
      name: 'Priya Patel',
      email: 'priya.patel@college.edu',
      phone: '+91 98765 43211',
      department: 'CSE',
      year: 4,
      cgpa: 9.20,
      skills: 'Java, Spring Boot, Microservices, Kubernetes, AWS',
      backlogs: 0,
      placement_status: 'Placed'
    },
    {
      student_id: 'AI202301',
      name: 'Rohan Verma',
      email: 'rohan.verma@college.edu',
      phone: '+91 98765 43212',
      department: 'AIML',
      year: 4,
      cgpa: 8.40,
      skills: 'Python, PyTorch, Scikit-Learn, TensorFlow, NLP',
      backlogs: 0,
      placement_status: 'Not Placed'
    },
    {
      student_id: 'IT202301',
      name: 'Sneha Reddy',
      email: 'sneha.reddy@college.edu',
      phone: '+91 98765 43213',
      department: 'IT',
      year: 4,
      cgpa: 7.95,
      skills: 'Full Stack MERN, Next.js, TailwindCSS, MongoDB',
      backlogs: 0,
      placement_status: 'Not Placed'
    },
    {
      student_id: 'EC202301',
      name: 'Vikram Joshi',
      email: 'vikram.joshi@college.edu',
      phone: '+91 98765 43214',
      department: 'ECE',
      year: 4,
      cgpa: 7.10,
      skills: 'Embedded C, Verilog, IoT, MATLAB, Python',
      backlogs: 1,
      placement_status: 'Not Placed'
    },
    {
      student_id: 'ME202301',
      name: 'Ananya Iyer',
      email: 'ananya.iyer@college.edu',
      phone: '+91 98765 43215',
      department: 'MECH',
      year: 4,
      cgpa: 6.80,
      skills: 'SolidWorks, AutoCAD, ANSYS, GD&T, C++',
      backlogs: 0,
      placement_status: 'Not Eligible'
    },
    {
      student_id: 'CS202303',
      name: 'Kavya Nair',
      email: 'kavya.nair@college.edu',
      phone: '+91 98765 43216',
      department: 'CSE',
      year: 4,
      cgpa: 8.65,
      skills: 'TypeScript, React, Golang, GraphQL, CI/CD',
      backlogs: 0,
      placement_status: 'Placed'
    }
  ];

  for (const s of students) {
    db.run(
      `INSERT INTO students (student_id, name, email, phone, department, year, cgpa, skills, backlogs, placement_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.student_id, s.name, s.email, s.phone, s.department, s.year, s.cgpa, s.skills, s.backlogs, s.placement_status]
    );
  }

  // 2. Seed Companies
  const companies = [
    {
      company_id: 'CMP001',
      company_name: 'Google India',
      industry: 'Information Technology',
      website: 'https://careers.google.com',
      location: 'Bengaluru / Hyderabad',
      contact_person: 'David Miller (Campus Talent Lead)',
      contact_email: 'campus-india@google.com'
    },
    {
      company_id: 'CMP002',
      company_name: 'Microsoft IDC',
      industry: 'Software & Cloud Computing',
      website: 'https://careers.microsoft.com',
      location: 'Hyderabad, India',
      contact_person: 'Anita Roy (University Relations)',
      contact_email: 'university-idc@microsoft.com'
    },
    {
      company_id: 'CMP003',
      company_name: 'Goldman Sachs',
      industry: 'Investment Banking & FinTech',
      website: 'https://goldmansachs.com/careers',
      location: 'Bengaluru, India',
      contact_person: 'Nikhil Taneja (Engineering Recruitment)',
      contact_email: 'india-recruiting@gs.com'
    },
    {
      company_id: 'CMP004',
      company_name: 'Amazon Development Centre',
      industry: 'E-commerce & Cloud Services',
      website: 'https://amazon.jobs',
      location: 'Chennai / Bengaluru',
      contact_person: 'Ritu Sen (Campus Specialist)',
      contact_email: 'campus-hire@amazon.com'
    },
    {
      company_id: 'CMP005',
      company_name: 'Tata Consultancy Services (TCS)',
      industry: 'IT Services & Consulting',
      website: 'https://tcs.com/careers',
      location: 'Pan India',
      contact_person: 'Mahesh Kumar (Regional HR Head)',
      contact_email: 'campus.tcs@tcs.com'
    }
  ];

  for (const c of companies) {
    db.run(
      `INSERT INTO companies (company_id, company_name, industry, website, location, contact_person, contact_email)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [c.company_id, c.company_name, c.industry, c.website, c.location, c.contact_person, c.contact_email]
    );
  }

  // 3. Seed Placement Drives
  const drives = [
    {
      company_id: 1, // Google
      job_role: 'Associate Software Engineer',
      package: '28 LPA',
      minimum_cgpa: 8.0,
      allowed_departments: 'CSE, AIML, IT',
      maximum_backlogs: 0,
      drive_date: '2026-10-15',
      application_deadline: '2026-10-05',
      location: 'Virtual / On-Campus Lab 3',
      description: 'Role involves core backend systems, distributed data structures, and cloud platform services. Technical assessment followed by 3 rounds of coding interviews.',
      status: 'Active'
    },
    {
      company_id: 2, // Microsoft
      job_role: 'Software Development Engineer - 1',
      package: '24 LPA',
      minimum_cgpa: 7.5,
      allowed_departments: 'CSE, AIML, IT, ECE',
      maximum_backlogs: 0,
      drive_date: '2026-10-22',
      application_deadline: '2026-10-12',
      location: 'Main Auditorium & Online CodeSignal',
      description: 'Seeking passionate developers for Azure and Office 365 core engineering. Proficiency in modern C++, C#, Java, or Python required.',
      status: 'Active'
    },
    {
      company_id: 3, // Goldman Sachs
      job_role: 'Quantitative & Tech Analyst',
      package: '22 LPA',
      minimum_cgpa: 8.2,
      allowed_departments: 'CSE, AIML, IT',
      maximum_backlogs: 0,
      drive_date: '2026-11-02',
      application_deadline: '2026-10-25',
      location: 'Virtual Proctored Drive',
      description: 'FinTech algorithm modeling, high-frequency low-latency execution engines, and risk management analytics.',
      status: 'Upcoming'
    },
    {
      company_id: 4, // Amazon
      job_role: 'SDE Intern & FTE',
      package: '20 LPA',
      minimum_cgpa: 7.0,
      allowed_departments: 'CSE, AIML, IT, ECE, EEE',
      maximum_backlogs: 1,
      drive_date: '2026-09-01',
      application_deadline: '2026-08-20',
      location: 'Bengaluru Campus',
      description: 'Hiring for Prime Video and AWS infrastructure engineering.',
      status: 'Closed'
    },
    {
      company_id: 5, // TCS
      job_role: 'Digital Innovator & Ninja Developer',
      package: '9 LPA',
      minimum_cgpa: 6.5,
      allowed_departments: 'CSE, AIML, IT, ECE, EEE, MECH',
      maximum_backlogs: 2,
      drive_date: '2026-11-15',
      application_deadline: '2026-11-05',
      location: 'College Campus - Central Computing Center',
      description: 'Mass recruitment drive for enterprise digital transformation projects, full-stack development, and IoT solutions.',
      status: 'Upcoming'
    }
  ];

  for (const d of drives) {
    db.run(
      `INSERT INTO placement_drives (company_id, job_role, package, minimum_cgpa, allowed_departments, maximum_backlogs, drive_date, application_deadline, location, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.company_id, d.job_role, d.package, d.minimum_cgpa, d.allowed_departments, d.maximum_backlogs, d.drive_date, d.application_deadline, d.location, d.description, d.status]
    );
  }

  // 4. Seed Applications
  const applications = [
    {
      student_id: 1, // Aarav Sharma
      placement_drive_id: 1, // Google
      status: 'Shortlisted',
      remarks: 'Cleared round 1 Online Assessment with 98% percentile. Scheduled for technical interview.'
    },
    {
      student_id: 1, // Aarav Sharma
      placement_drive_id: 2, // Microsoft
      status: 'Applied',
      remarks: 'Application under resume screening.'
    },
    {
      student_id: 2, // Priya Patel
      placement_drive_id: 2, // Microsoft
      status: 'Selected',
      remarks: 'Selected with outstanding performance in system design and DS/Algo.'
    },
    {
      student_id: 3, // Rohan Verma
      placement_drive_id: 1, // Google
      status: 'Applied',
      remarks: 'Application submitted for ASE role.'
    },
    {
      student_id: 4, // Sneha Reddy
      placement_drive_id: 2, // Microsoft
      status: 'Shortlisted',
      remarks: 'Qualified in coding round. Awaiting interview slot.'
    },
    {
      student_id: 7, // Kavya Nair
      placement_drive_id: 4, // Amazon
      status: 'Selected',
      remarks: 'Offer letter generated. Accepted package.'
    }
  ];

  for (const a of applications) {
    db.run(
      `INSERT INTO applications (student_id, placement_drive_id, status, remarks)
       VALUES (?, ?, ?, ?)`,
      [a.student_id, a.placement_drive_id, a.status, a.remarks]
    );
  }

  // 5. Seed Users for Role-Based Access
  const users = [
    {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'Dr. Robert Vance',
      email: 'placement.head@college.edu',
      linked_student_id: null,
      linked_company_id: null
    },
    {
      username: 'student',
      password: 'student123',
      role: 'student',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@college.edu',
      linked_student_id: 1,
      linked_company_id: null
    },
    {
      username: 'student_priya',
      password: 'student123',
      role: 'student',
      name: 'Priya Patel',
      email: 'priya.patel@college.edu',
      linked_student_id: 2,
      linked_company_id: null
    },
    {
      username: 'recruiter',
      password: 'recruiter123',
      role: 'recruiter',
      name: 'David Miller',
      email: 'campus-india@google.com',
      linked_student_id: null,
      linked_company_id: 1 // Google
    }
  ];

  for (const u of users) {
    db.run(
      `INSERT INTO users (username, password, role, name, email, linked_student_id, linked_company_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [u.username, u.password, u.role, u.name, u.email, u.linked_student_id, u.linked_company_id]
    );
  }

  persistDatabase();
  console.log('[Database] Seed data successfully populated!');
}

export function resetDatabase() {
  if (!dbInstance) return;
  dbInstance.run('DROP TABLE IF EXISTS applications;');
  dbInstance.run('DROP TABLE IF EXISTS placement_drives;');
  dbInstance.run('DROP TABLE IF EXISTS companies;');
  dbInstance.run('DROP TABLE IF EXISTS students;');
  dbInstance.run('DROP TABLE IF EXISTS users;');
  initSchemaAndSeed(dbInstance);
}
