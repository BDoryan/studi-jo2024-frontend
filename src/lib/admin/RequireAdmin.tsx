import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext';

interface RequireAdminProps {
  children: React.ReactElement;
  redirectTo?: string;
}

const LoadingScreen: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <svg
        className="h-10 w-10 animate-spin text-primary-500"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        role="status"
        aria-label="Chargement"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <span className="text-sm font-semibold uppercase tracking-wide text-primary-500">
        Chargement de l’espace administrateur...
      </span>
    </div>
  </div>
);

export const RequireAdmin: React.FC<RequireAdminProps> = ({
  children,
  redirectTo = '/',
}) => {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
};
