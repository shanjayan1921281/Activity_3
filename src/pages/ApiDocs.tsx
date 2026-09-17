import React, { useState } from 'react';
import {
  Terminal,
  Database,
  Shield,
  CheckCircle2,
  Copy,
  BookOpen,
  Code,
  Server,
  Layers,
  Check,
} from 'lucide-react';

export const ApiDocs: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const endpoints = [
    {
      method: 'POST',
      path: '/api/auth/login',
      role: 'Public',
      desc: 'Authenticates user and returns session Bearer token, user role, and profile.',
    },
    {
      method: 'GET',
      path: '/api/auth/me',
      role: 'Authenticated',
      desc: 'Returns current logged-in user profile, student or company link.',
    },
    {
      method: 'GET',
      path: '/api/students',
      role: 'Admin / Recruiter',
      desc: 'Retrieves paginated student list with search, department, year, and status filters.',
    },
    {
      method: 'POST',
      path: '/api/students',
      role: 'Admin',
      desc: 'Registers a new student with roll number, CGPA, backlogs, and department.',
    },
    {
      method: 'PUT',
      path: '/api/students/:id',
      role: 'Admin / Student (Self)',
      desc: 'Updates student record. Validates CGPA range (0-10) and non-negative backlogs.',
    },
    {
      method: 'DELETE',
      path: '/api/students/:id',
      role: 'Admin',
      desc: 'Deletes student record and removes associated applications cascadingly.',
    },
    {
      method: 'GET',
      path: '/api/companies',
      role: 'Authenticated',
      desc: 'Retrieves all registered recruiting companies with search and industry filter.',
    },
    {
      method: 'POST',
      path: '/api/companies',
      role: 'Admin',
      desc: 'Registers new corporate partner with HR contact email and industry details.',
    },
    {
      method: 'GET',
      path: '/api/drives',
      role: 'Authenticated',
      desc: 'Retrieves all campus placement drives with status, eligibility, and applicant count.',
    },
    {
      method: 'GET',
      path: '/api/drives/:id/eligibility',
      role: 'Student / Admin',
      desc: 'Evaluates real-time candidate eligibility against CGPA, backlogs, and branch criteria.',
    },
    {
      method: 'POST',
      path: '/api/applications',
      role: 'Student / Admin',
      desc: 'Submits application for a drive. Server verifies candidate eligibility before insertion.',
    },
    {
      method: 'PUT',
      path: '/api/applications/:id',
      role: 'Admin / Recruiter',
      desc: 'Updates status (Applied → Shortlisted → Selected / Rejected). Auto-marks student Placed if Selected!',
    },
    {
      method: 'GET',
      path: '/api/dashboard/stats',
      role: 'Authenticated',
      desc: 'Returns aggregated KPI statistics: totals, active drives, placed count, and department placement %.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 mb-3 border border-white/10">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            Full-Stack Project Documentation & Viva Evaluation Guide
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            System Architecture & REST API Reference
          </h2>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
            This College Placement Management System is built with a decoupled client-server architecture:
            a React frontend communicating with an Express REST API backed by an SQLite relational database.
          </p>
        </div>
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
            <Database className="w-4 h-4 text-indigo-600" />
            Relational Persistence
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Real SQLite database with foreign keys, cascading deletions, unique constraints on roll numbers and emails, and seed datasets.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
            <Shield className="w-4 h-4 text-emerald-600" />
            Role-Based Authorization
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Enforces RBAC via Bearer tokens for <strong>Admin</strong>, <strong>Student</strong>, and <strong>Recruiter</strong> roles across both UI and API endpoints.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
            <Server className="w-4 h-4 text-purple-600" />
            Business Logic Cascade
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Real-time eligibility engine and automated state machine: selecting an application automatically transitions student status to <code>Placed</code>.
          </p>
        </div>
      </div>

      {/* REST API Endpoints Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-600" />
            RESTful API Endpoints
          </h3>
          <span className="text-xs font-semibold text-slate-400">13 Core Endpoints</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Endpoint Path</th>
                <th className="py-3 px-3">Allowed Roles</th>
                <th className="py-3 px-3">Operation Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {endpoints.map((ep, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        ep.method === 'GET'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : ep.method === 'POST'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : ep.method === 'PUT'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {ep.method}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                    {ep.path}
                  </td>

                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                    {ep.role}
                  </td>

                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 leading-relaxed">
                    {ep.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Postman / Curl Test Cases */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-600" />
            Postman / cURL Test Cases (Viva Demonstration)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Copy and run these commands in terminal or Postman to test end-to-end backend functionality.
          </p>
        </div>

        {/* Test Case 1: Login */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>1. Admin Login (Obtain Bearer Token)</span>
            <button
              onClick={() =>
                copyToClipboard(
                  `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'`,
                  't1'
                )
              }
              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              {copiedId === 't1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedId === 't1' ? 'Copied' : 'Copy cURL'}
            </button>
          </div>
          <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto">
{`curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin123"}'`}
          </pre>
        </div>

        {/* Test Case 2: Check Eligibility */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>2. Check Drive Eligibility for Student (Drive #1, Student #1)</span>
            <button
              onClick={() =>
                copyToClipboard(
                  `curl -X GET "http://localhost:3000/api/drives/1/eligibility?student_id=1" -H "Authorization: Bearer <TOKEN>"`,
                  't2'
                )
              }
              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              {copiedId === 't2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedId === 't2' ? 'Copied' : 'Copy cURL'}
            </button>
          </div>
          <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto">
{`curl -X GET "http://localhost:3000/api/drives/1/eligibility?student_id=1" \\
  -H "Authorization: Bearer <TOKEN>"`}
          </pre>
        </div>

        {/* Test Case 3: Update Application Status to Selected */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>3. Mark Application as Selected (Triggers Student Placement Status Update)</span>
            <button
              onClick={() =>
                copyToClipboard(
                  `curl -X PUT http://localhost:3000/api/applications/1 -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" -d '{"status":"Selected","remarks":"Offered SDE Role"}'`,
                  't3'
                )
              }
              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              {copiedId === 't3' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedId === 't3' ? 'Copied' : 'Copy cURL'}
            </button>
          </div>
          <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto">
{`curl -X PUT http://localhost:3000/api/applications/1 \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -d '{"status":"Selected","remarks":"Offered SDE Role"}'`}
          </pre>
        </div>
      </div>
    </div>
  );
};
