import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Compass,
  PlusCircle,
  AlertCircle,
  FileCheck2,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Phone,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { isLiveSupabase } from '../supabaseClient.ts';
import { LostLinkLogoMark, LostLinkWordmark } from '../components/Logo.tsx';

export const AppLayout: React.FC = () => {
  const { user, profile, isAdmin, logout, switchDemoRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/items', label: 'Claim Board', icon: <Compass className="w-4 h-4" /> },
    { to: '/report-lost', label: 'Link Lost Item', icon: <AlertCircle className="w-4 h-4 text-[#D94825]" /> },
    { to: '/report-found', label: 'Link Found Item', icon: <PlusCircle className="w-4 h-4 text-[#0E6251]" /> },
    { to: '/claims', label: 'My Claims', icon: <FileCheck2 className="w-4 h-4" /> },
    { to: '/dashboard', label: 'My Tickets', icon: <LayoutDashboard className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F4ECE1] text-[#1E1B18]">
      {/* Top Claim Dispatch Bar */}
      <aside aria-label="Campus claim dispatch notice" className="bg-[#1E1B18] text-[#FCF8F2] text-xs py-2 px-4 border-b border-[#342F2A]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D94825] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D94825]"></span>
            </span>
            <span className="font-mono font-bold text-white uppercase tracking-wider text-[11px]">
              Lost-Link · [COLLEGE NAME] Dispatch
            </span>
            <span className="text-[#8C7E70]">|</span>
            <span className="text-[#D5C4AF] font-mono text-[11px]">
              {isLiveSupabase ? (
                <span className="text-[#0E6251] font-bold">Cloud Connected</span>
              ) : (
                <span>Interactive Campus Demo</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#A69584] text-[11px] font-mono flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#D94825]" /> Holder:
            </span>
            <span className="bg-[#342F2A] border border-[#524B43] px-2 py-0.5 rounded font-mono text-white text-[11px]">
              {profile?.full_name || 'Guest'} ({profile?.role || 'student'})
            </span>
            {!isLiveSupabase && (
              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={() => switchDemoRole('student')}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    profile?.role === 'student'
                      ? 'bg-[#0E6251] text-white font-bold'
                      : 'bg-[#2A2622] text-[#D5C4AF] hover:bg-[#342F2A]'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoRole('admin')}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    profile?.role === 'admin'
                      ? 'bg-[#D94825] text-white font-bold'
                      : 'bg-[#2A2622] text-[#D5C4AF] hover:bg-[#342F2A]'
                  }`}
                >
                  Admin
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Header */}
      <header className="bg-[#FCF8F2] border-b-2 border-[#DECBB6] sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Wordmark and Luggage Tag Logo */}
            <div className="flex items-center gap-8">
              <Link to="/items" className="flex items-center gap-3 group">
                <LostLinkLogoMark size={42} className="group-hover:rotate-6 transition-transform duration-200" />
                <div className="flex flex-col">
                  <LostLinkWordmark size="md" />
                  <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-[#8C7E70] mt-0.5">
                    [COLLEGE NAME] Claim System
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1.5 ml-4">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#EFE4D3] text-[#1E1B18] shadow-xs border border-[#DECBB6]'
                          : 'text-[#6B6258] hover:text-[#1E1B18] hover:bg-[#EAE0D0]/60'
                      }`
                    }
                  >
                    {link.icon}
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden sm:flex items-center gap-1.5 bg-[#1E1B18] hover:bg-[#342F2A] text-white font-mono font-bold px-3 py-2 rounded-xl text-xs shadow-xs border border-[#342F2A] transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-[#D94825]" /> Dispatcher Desk
                </Link>
              )}

              {user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-xs font-display font-bold text-[#1E1B18]">{profile?.full_name}</span>
                    <span className="text-[11px] text-[#8C7E70] font-mono">{profile?.roll_number}</span>
                  </div>

                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2 text-[#8C7E70] hover:text-[#D94825] hover:bg-[#FCECE8] rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-xs font-bold text-[#1E1B18] hover:text-[#0E6251] px-3.5 py-2 rounded-xl hover:bg-[#EAE0D0] transition-colors font-mono"
                  >
                    Ticket Kiosk
                  </Link>
                  <Link
                    to="/register"
                    className="text-xs font-bold text-white bg-[#0E6251] hover:bg-[#09473A] px-4 py-2 rounded-xl shadow-xs transition-colors font-mono"
                  >
                    Register ID
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-[#1E1B18] hover:bg-[#EAE0D0] rounded-xl"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t-2 border-[#DECBB6] bg-[#FCF8F2] px-4 pt-3 pb-5 space-y-1.5 shadow-lg">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    isActive
                      ? 'bg-[#EFE4D3] text-[#1E1B18] border border-[#DECBB6]'
                      : 'text-[#6B6258] hover:bg-[#EAE0D0]'
                  }`
                }
              >
                {link.icon}
                {link.label}
              </NavLink>
            ))}

            {isAdmin && (
              <NavLink
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-[#1E1B18] text-white mt-2"
              >
                <ShieldCheck className="w-4 h-4 text-[#D94825]" /> Dispatcher Desk
              </NavLink>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Claim Tag Footer */}
      <footer className="bg-[#1E1B18] text-[#D5C4AF] text-xs border-t-4 border-[#8C6D4F] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <LostLinkLogoMark size={32} />
                <LostLinkWordmark size="sm" dark={true} />
              </div>
              <p className="text-[#A69584] leading-relaxed text-xs font-sans">
                Lost it? Link it back. The official [COLLEGE NAME] student claim ticket repository.
              </p>
            </div>

            <div>
              <h4 className="font-mono font-bold text-white uppercase tracking-wider text-[11px] mb-3 text-[#D94825]">
                Campus Claim Counter
              </h4>
              <ul className="space-y-2 text-xs font-mono">
                <li className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-[#D94825] shrink-0 mt-0.5" />
                  <span>Central Security Desk Room 104, [COLLEGE NAME]</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#0E6251] shrink-0" />
                  <span>24/7 Dispatch: +1 (555) 019-LINK</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#D5C4AF] shrink-0" />
                  <span>Desk Hours: Mon–Fri, 8:30 AM – 6:00 PM</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono font-bold text-white uppercase tracking-wider text-[11px] mb-3 text-[#0E6251]">
                Claim Policy
              </h4>
              <ul className="space-y-1.5 text-xs text-[#A69584]">
                <li>• All reported items held for minimum 90 days.</li>
                <li>• Valid student ID card required upon physical collection.</li>
                <li>• High-value gadgets secured in dual-custody safes.</li>
                <li>• Every handover is audited in the permanent register.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono font-bold text-white uppercase tracking-wider text-[11px] mb-3">
                Quick Claim Actions
              </h4>
              <div className="flex flex-col space-y-2 font-mono text-xs">
                <Link to="/items" className="hover:text-white transition-colors">→ Search All Claim Tickets</Link>
                <Link to="/report-lost" className="hover:text-[#D94825] transition-colors">→ Link a Lost Item</Link>
                <Link to="/report-found" className="hover:text-[#0E6251] transition-colors">→ Link a Found Item</Link>
                <Link to="/claims" className="hover:text-white transition-colors">→ Check My Claim Status</Link>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#342F2A] flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#8C7E70] gap-2">
            <p>Lost-Link · [COLLEGE NAME] Lost &amp; Found</p>
            <p>Every lost item deserves to be linked home.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
