import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { type ReactElement } from "react";

// ============================================
// 📌 AUTH PAGES
// ============================================
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
// App.tsx - Add this route

import ChangePassword from "./pages/ChangePassword";

// Add this route (public, but requires token)


// ============================================
// 📌 CHAT PAGES
// ============================================
import Chat from './pages/Chat';
import ParentChat from "./pages/parent/ParentChat";
import AdminChat from "./pages/admin/AdminChat";
import TeacherChat from "./pages/teacher/TeacherChat";

// ============================================
// 📌 ADMIN PAGES
// ============================================
import AdminDashboard from "./pages/admin/AdminDashboard";
import Students from "./pages/admin/Students";
import Teachers from "./pages/admin/Teachers";
import Announcements from "./pages/admin/Announcements";
import AdminAttendance from "./pages/admin/Attendance";
import AdminGrades from "./pages/admin/Grades";
import AdminPayments from "./pages/admin/Payments";
import Settings from "./pages/admin/Settings";

// ============================================
// 📌 REGISTRAR PAGES
// ============================================
import RegistrarDashboard from "./pages/registrar/RegistrarDashboard";
import RegistrarStudents from './pages/registrar/RegistrarStudents';
import RegistrarTeachers from './pages/registrar/RegistrarTeachers';
import RegistrarClasses from './pages/registrar/RegistrarClasses';
import RegistrarParents from './pages/registrar/RegistrarParents';
import RegistrarPasswordReset from "./pages/registrar/RegistrarPasswordReset"; // ✅ ADD THIS

// ============================================
// 📌 FINANCE OFFICER PAGES
// ============================================
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import FinancePayments from './pages/finance/FinancePayments';
import FinanceFees from './pages/finance/FinanceFees';

// ============================================
// 📌 TEACHER PAGES
// ============================================
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherAttendance from "./pages/teacher/Attendance";
import TeacherGrades from "./pages/teacher/Grades";
import TeacherAnnouncements from "./pages/teacher/TeacherAnnouncement";
import TeacherWorksheets from './pages/teacher/Worksheets';
import TeacherWorksheetResults from './pages/teacher/TeacherWorksheetResults';
import TeacherReportCards from "./pages/teacher/ReportCards";
import TeacherResources from "./pages/teacher/Resources";

// ============================================
// 📌 STUDENT PAGES
// ============================================
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentMyGrades from "./pages/student/MyGrades";
import StudentMyAttendance from "./pages/student/MyAttendance";
import StudentFees from "./pages/student/Fees";
import StudentAnnouncements from "./pages/student/Announcements";
import StudentAvailableWorksheets from './pages/student/AvailableWorksheets';
import WorksheetAttempt from './pages/student/StudentWorksheets';
import WorksheetReview from "./pages/student/WorksheetReview";
import StudentResources from "./pages/student/Resources";
import StudentReportCards from "./pages/student/ReportCards";


// ============================================
// 📌 PARENT PAGES
// ============================================
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentAttendance from "./pages/parent/ParentAttendance";
import ParentGrades from "./pages/parent/ParentGrades";
import ParentPayments from "./pages/parent/Payments";
import ParentAnnouncements from "./pages/parent/ParentAnnouncements";
import ParentChildren from "./pages/parent/ParentChildren";
import ParentChildGrades from './pages/parent/ParentChildGrades';
import ParentChildAttendance from './pages/parent/ParentChildAttendance';

// ============================================
// 📌 AUTH GUARD COMPONENT
// ============================================
const PrivateRoute = ({ children, allowedRoles }: { children: ReactElement, allowedRoles?: string[] }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    window.location.href = '/';
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    window.location.href = '/';
    return null;
  }

  return children;
};

// ============================================
// 📌 APP COMPONENT
// ============================================
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ============================================
            PUBLIC ROUTES
            ============================================ */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ============================================
            STUDENT WORKSHEET REVIEW (Public/Shared)
            ============================================ */}
        <Route path="/student/worksheets/:id/review" element={<WorksheetReview />} />

        {/* ============================================
            ADMIN ROUTES
            ============================================ */}
        <Route path="/admin" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </PrivateRoute>
        } />
        <Route path="/admin/students" element={
          <PrivateRoute allowedRoles={['admin']}>
            <Students />
          </PrivateRoute>
        } />
        <Route path="/admin/teachers" element={
          <PrivateRoute allowedRoles={['admin']}>
            <Teachers />
          </PrivateRoute>
        } />
        <Route path="/admin/announcements" element={
          <PrivateRoute allowedRoles={['admin']}>
            <Announcements />
          </PrivateRoute>
        } />
        <Route path="/admin/attendance" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminAttendance />
          </PrivateRoute>
        } />
        <Route path="/admin/grades" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminGrades />
          </PrivateRoute>
        } />
        <Route path="/admin/payments" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminPayments />
          </PrivateRoute>
        } />
        <Route path="/admin/settings" element={
          <PrivateRoute allowedRoles={['admin']}>
            <Settings />
          </PrivateRoute>
        } />
        <Route path="/admin/chat" element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminChat />
          </PrivateRoute>
        } />

        {/* ============================================
            REGISTRAR ROUTES
            ============================================ */}
        <Route path="/registrar" element={
          <PrivateRoute allowedRoles={['admin', 'registrar']}>
            <RegistrarDashboard />
          </PrivateRoute>
        } />
        <Route path="/registrar/students" element={
          <PrivateRoute allowedRoles={['admin', 'registrar']}>
            <RegistrarStudents />
          </PrivateRoute>
        } />
        <Route path="/registrar/teachers" element={
          <PrivateRoute allowedRoles={['admin', 'registrar']}>
            <RegistrarTeachers />
          </PrivateRoute>
        } />
        <Route path="/registrar/classes" element={
          <PrivateRoute allowedRoles={['admin', 'registrar']}>
            <RegistrarClasses />
          </PrivateRoute>
        } />
        <Route path="/registrar/parents" element={
          <PrivateRoute allowedRoles={['admin', 'registrar']}>
            <RegistrarParents />
          </PrivateRoute>
        } />
        {/* ✅ ADD THIS - Registrar Password Reset */}
        <Route path="/registrar/password-reset" element={
          <PrivateRoute allowedRoles={['admin', 'registrar']}>
            <RegistrarPasswordReset />
          </PrivateRoute>
        } />

        {/* ============================================
            FINANCE OFFICER ROUTES
            ============================================ */}
        <Route path="/finance" element={
          <PrivateRoute allowedRoles={['admin', 'finance_officer']}>
            <FinanceDashboard />
          </PrivateRoute>
        } />
        <Route path="/finance/payments" element={
          <PrivateRoute allowedRoles={['admin', 'finance_officer']}>
            <FinancePayments />
          </PrivateRoute>
        } />
        <Route path="/finance/fees" element={
          <PrivateRoute allowedRoles={['admin', 'finance_officer']}>
            <FinanceFees />
          </PrivateRoute>
        } />
        <Route path="/finance/reports" element={
          <PrivateRoute allowedRoles={['admin', 'finance_officer']}>
            <FinanceDashboard />
          </PrivateRoute>
        } />

        {/* ============================================
            TEACHER ROUTES
            ============================================ */}
        <Route path="/teacher" element={
          <PrivateRoute allowedRoles={['admin', 'teacher']}>
            <TeacherDashboard />
          </PrivateRoute>
        } />
        <Route path="/teacher/attendance" element={
          <PrivateRoute allowedRoles={['admin', 'teacher']}>
            <TeacherAttendance />
          </PrivateRoute>
        } />
        <Route path="/teacher/grades" element={
          <PrivateRoute allowedRoles={['admin', 'teacher']}>
            <TeacherGrades />
          </PrivateRoute>
        } />
        <Route path="/teacher/announcements" element={
          <PrivateRoute allowedRoles={['admin', 'teacher']}>
            <TeacherAnnouncements />
          </PrivateRoute>
        } />
        <Route path="/teacher/worksheets" element={
          <PrivateRoute allowedRoles={['admin', 'teacher']}>
            <TeacherWorksheets />
          </PrivateRoute>
        } />
        <Route path="/teacher/worksheets/:id/results" element={
          <PrivateRoute allowedRoles={['admin', 'teacher']}>
            <TeacherWorksheetResults />
          </PrivateRoute>
        } />
<Route path="/teacher/chat" element={
    <PrivateRoute allowedRoles={['admin', 'teacher']}>
        <TeacherChat />
    </PrivateRoute>
} />
<Route path="/teacher/resources" element={
    <PrivateRoute allowedRoles={['admin', 'teacher']}>
        <TeacherResources />
    </PrivateRoute>
} />
<Route path="/teacher/report-cards" element={
    <PrivateRoute allowedRoles={['admin', 'teacher']}>
        <TeacherReportCards />
    </PrivateRoute>
} />
        {/* ============================================
            STUDENT ROUTES
            ============================================ */}
        <Route path="/student" element={
          <PrivateRoute allowedRoles={['admin', 'student']}>
            <StudentDashboard />
          </PrivateRoute>
        } />
        <Route path="/student/grades" element={
          <PrivateRoute allowedRoles={['admin', 'student']}>
            <StudentMyGrades />
          </PrivateRoute>
        } />
        <Route path="/student/attendance" element={
          <PrivateRoute allowedRoles={['admin', 'student']}>
            <StudentMyAttendance />
          </PrivateRoute>
        } />
        <Route path="/student/fees" element={
          <PrivateRoute allowedRoles={['admin', 'student']}>
            <StudentFees />
          </PrivateRoute>
        } />
        <Route path="/student/announcements" element={
          <PrivateRoute allowedRoles={['admin', 'student']}>
            <StudentAnnouncements />
          </PrivateRoute>
        } />
        <Route path="/student/worksheets" element={
          <PrivateRoute allowedRoles={['admin', 'student']}>
            <StudentAvailableWorksheets />
          </PrivateRoute>
        } />
        <Route path="/student/worksheet/:id/attempt" element={
          <PrivateRoute allowedRoles={['admin', 'student']}>
            <WorksheetAttempt />
          </PrivateRoute>
        } />
        <Route path="/student/worksheets/:id/review" element={
          <PrivateRoute allowedRoles={['admin', 'student']}>
            <WorksheetReview />
          </PrivateRoute>
        } />
<Route path="/student/resources" element={
    <PrivateRoute allowedRoles={['admin', 'student']}>
        <StudentResources />
    </PrivateRoute>
} />
<Route path="/student/report-cards" element={
    <PrivateRoute allowedRoles={['admin', 'student']}>
        <StudentReportCards />
    </PrivateRoute>
} />  
        {/* ============================================
            PARENT ROUTES
            ============================================ */}
        <Route path="/parent" element={
          <PrivateRoute allowedRoles={['admin', 'parent']}>
            <ParentDashboard />
          </PrivateRoute>
        } />
        <Route path="/parent/attendance" element={
          <PrivateRoute allowedRoles={['admin', 'parent']}>
            <ParentAttendance />
          </PrivateRoute>
        } />
        <Route path="/parent/grades" element={
          <PrivateRoute allowedRoles={['admin', 'parent']}>
            <ParentGrades />
          </PrivateRoute>
        } />
        <Route path="/parent/payments" element={
          <PrivateRoute allowedRoles={['admin', 'parent']}>
            <ParentPayments />
          </PrivateRoute>
        } />
        <Route path="/parent/announcements" element={
          <PrivateRoute allowedRoles={['admin', 'parent']}>
            <ParentAnnouncements />
          </PrivateRoute>
        } />
        <Route path="/parent/children" element={
          <PrivateRoute allowedRoles={['admin', 'parent']}>
            <ParentChildren />
          </PrivateRoute>
        } />
        <Route path="/parent/child/:childId/grades" element={
          <PrivateRoute allowedRoles={['admin', 'parent']}>
            <ParentChildGrades />
          </PrivateRoute>
        } />
        <Route path="/parent/child/:childId/attendance" element={
          <PrivateRoute allowedRoles={['admin', 'parent']}>
            <ParentChildAttendance />
          </PrivateRoute>
        } />
        <Route path="/parent/chat" element={
          <PrivateRoute allowedRoles={['admin', 'parent']}>
            <ParentChat />
          </PrivateRoute>
        } />

        {/* ============================================
            CHAT ROUTES (General)
            ============================================ */}
        <Route path="/chat" element={
          <PrivateRoute allowedRoles={['admin', 'teacher', 'parent', 'student']}>
            <Chat />
          </PrivateRoute>
        } />
        <Route path="/change-password" element={<ChangePassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;