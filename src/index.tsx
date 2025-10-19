import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './tailwind.css';
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Account from "@/pages/Account";
import Offers from "@/pages/Offers";
import NotFound from "@/pages/NotFound";
import { AuthProvider, RequireAuth, useAuth } from '@/lib/auth';
import AdminRouter from '@/pages/admin/AdminRouter';
import { ADMIN_ROOT_PATH } from '@/pages/admin/constants';

const AppRouter: React.FC = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <svg
                    className="h-10 w-10 animate-spin text-primary-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    role="status"
                    aria-label="Chargement"
                >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span className="text-sm font-semibold uppercase tracking-wide text-primary-500">
                  Chargement de votre session...
                </span>
            </div>
        </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/offers" element={<Offers />} />
      <Route path={`${ADMIN_ROOT_PATH}/*`} element={<AdminRouter />} />
      <Route path="*" element={<NotFound />} />
      <Route
        path="/account"
        element={
          <RequireAuth>
            <Account />
          </RequireAuth>
        }
      />
    </Routes>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
