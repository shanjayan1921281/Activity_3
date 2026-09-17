import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { RoleGuard } from './components/common/RoleGuard';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { StudentList } from './pages/students/StudentList';
import { StudentForm } from './pages/students/StudentForm';
import { CompanyList } from './pages/companies/CompanyList';
import { CompanyForm } from './pages/companies/CompanyForm';
import { DriveList } from './pages/drives/DriveList';
import { DriveForm } from './pages/drives/DriveForm';
import { AvailableDrives } from './pages/drives/AvailableDrives';
import { ApplicationList } from './pages/applications/ApplicationList';
import { StudentProfile } from './pages/StudentProfile';
import { ApiDocs } from './pages/ApiDocs';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Application Routes */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Student Management */}
              <Route
                path="/students"
                element={
                  <RoleGuard allowedRoles={['admin', 'recruiter']}>
                    <StudentList />
                  </RoleGuard>
                }
              />
              <Route
                path="/students/new"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <StudentForm />
                  </RoleGuard>
                }
              />
              <Route
                path="/students/:id/edit"
                element={
                  <RoleGuard allowedRoles={['admin', 'student']}>
                    <StudentForm />
                  </RoleGuard>
                }
              />

              {/* Company Management */}
              <Route path="/companies" element={<CompanyList />} />
              <Route
                path="/companies/new"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <CompanyForm />
                  </RoleGuard>
                }
              />
              <Route
                path="/companies/:id/edit"
                element={
                  <RoleGuard allowedRoles={['admin', 'recruiter']}>
                    <CompanyForm />
                  </RoleGuard>
                }
              />

              {/* Placement Drives */}
              <Route path="/drives" element={<DriveList />} />
              <Route
                path="/drives/new"
                element={
                  <RoleGuard allowedRoles={['admin', 'recruiter']}>
                    <DriveForm />
                  </RoleGuard>
                }
              />
              <Route
                path="/drives/:id/edit"
                element={
                  <RoleGuard allowedRoles={['admin', 'recruiter']}>
                    <DriveForm />
                  </RoleGuard>
                }
              />

              {/* Student Drive Portal & Applications */}
              <Route path="/available-drives" element={<AvailableDrives />} />
              <Route path="/applications" element={<ApplicationList />} />

              {/* Student Profile */}
              <Route
                path="/profile"
                element={
                  <RoleGuard allowedRoles={['student']}>
                    <StudentProfile />
                  </RoleGuard>
                }
              />

              {/* Documentation & Postman Guide */}
              <Route path="/api-docs" element={<ApiDocs />} />

              {/* 404 Fallback */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
