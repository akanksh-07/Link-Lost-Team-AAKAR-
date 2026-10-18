import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Spinner } from './Spinner.tsx';
import { ShieldAlert } from 'lucide-react';
import { Button } from './Button.tsx';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading, switchDemoRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <Spinner size="xl" />
        <p className="mt-4 text-sm font-medium text-slate-500">Verifying administrative privileges...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-rose-200 rounded-2xl shadow-sm text-center">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Campus Security &amp; Admin Access Only</h2>
        <p className="text-sm text-slate-600 mb-6">
          You are currently signed in as a student (<strong>{profile?.full_name}</strong>). To manage campus inventory, approve claims, or review status audits, please switch to the Admin profile.
        </p>
        <div className="flex flex-col gap-2.5">
          <Button
            variant="primary"
            onClick={() => switchDemoRole('admin')}
          >
            Switch to Admin Demo (Officer Marcus)
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
