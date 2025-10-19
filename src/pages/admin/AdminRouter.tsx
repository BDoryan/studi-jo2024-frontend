import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider, RequireAdmin } from '@/lib/admin';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/dashboard/AdminDashboard';
import { ADMIN_LOGIN_PATH } from '@/pages/admin/constants';
import AdminTicketScanner from '@/pages/admin/scanner/AdminTicketScanner';

const AdminRouter: React.FC = () => {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route index element={<AdminLogin />} />
        <Route path="login" element={<AdminLogin />} />
        <Route
          path="dashboard"
          element={
            <RequireAdmin redirectTo={ADMIN_LOGIN_PATH}>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route
          path="dashboard/scanner"
          element={
            <RequireAdmin redirectTo={ADMIN_LOGIN_PATH}>
              <AdminTicketScanner />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </AdminAuthProvider>
  );
};

export default AdminRouter;
