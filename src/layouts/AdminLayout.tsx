import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { LostLinkLogoMark, LostLinkWordmark } from '../components/Logo.tsx';

export const AdminLayout: React.FC = () => {
  const { profile, logout, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F4ECE1] flex flex-col text-[#1E1B18]">
      {/* Admin Dispatch Bar */}
      <header className="bg-[#1E1B18] text-white border-b-4 border-[#8C6D4F] sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <LostLinkLogoMark size={36} />
              <div>
                <div className="flex items-center gap-2">
                  <LostLinkWordmark size="sm" dark={true} />
                  <span className="bg-[#D94825] text-white text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded">
                    Dispatcher Console
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[#D5C4AF] mt-0.5">
                  Officer on Duty: <strong className="text-white">{profile?.full_name}</strong> ({profile?.roll_number || 'DISPATCH-SEC-09'}) · [COLLEGE NAME]
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/items"
                className="text-xs font-mono font-bold text-[#D5C4AF] hover:text-white flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2A2622] hover:bg-[#342F2A] border border-[#524B43] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Public Claim Board
              </Link>

              <button
                type="button"
                onClick={() => {
                  switchDemoRole('student');
                  navigate('/items');
                }}
                className="text-xs font-mono font-bold text-[#E7F3F0] hover:text-white bg-[#0E6251] hover:bg-[#09473A] px-3 py-2 rounded-xl transition-colors hidden sm:inline-block cursor-pointer"
              >
                Switch to Student View
              </button>

              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 text-[#8C7E70] hover:text-[#D94825] hover:bg-[#2A2622] rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content Area */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
};
