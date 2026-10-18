import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Sparkles, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Input } from '../components/Input.tsx';
import { Button } from '../components/Button.tsx';
import { Alert } from '../components/Alert.tsx';
import { validateLogin } from '../lib/validation.ts';
import { LostLinkLogoMark, LostLinkWordmark } from '../components/Logo.tsx';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/items';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validation = validateLogin(email, password);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setIsLoading(true);

    const { error } = await login(email, password);
    setIsLoading(false);

    if (error) {
      setServerError(error.message || 'Invalid college email or password. Please try again.');
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLoading(true);
    setServerError(null);
    const { error } = await login(demoEmail, demoPass);
    setIsLoading(false);
    if (!error) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 sm:my-12">
      <div className="bg-[#FCF8F2] rounded-3xl border-3 border-[#DECBB6] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center border-b-2 border-dashed border-[#DECBB6] bg-[#EFE4D3]/50">
          <div className="flex justify-center mb-3">
            <LostLinkLogoMark size={48} />
          </div>
          <LostLinkWordmark size="lg" className="justify-center" />
          <p className="font-mono text-xs text-[#8C6D4F] mt-1.5 uppercase tracking-wider font-bold">
            [COLLEGE NAME] · Ticket Kiosk Access
          </p>
        </div>

        {/* Demo Fast Login Preset Box */}
        <div className="px-8 pt-6 pb-2">
          <div className="bg-[#EFE4D3]/70 border-2 border-[#DECBB6] rounded-2xl p-3.5 text-xs font-mono text-[#1E1B18]">
            <div className="flex items-center gap-1.5 font-bold mb-2 text-[#8C6D4F]">
              <Sparkles className="w-4 h-4 text-[#D94825]" />
              <span>1-Click Demo Passes (Instant Holder Session)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('alex.rivera@campus.edu', 'Password123!')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#FCF8F2] border border-[#DECBB6] font-bold text-[#1E1B18] hover:bg-[#EFE4D3] transition-colors shadow-2xs text-[11px] cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-[#0E6251]" /> Student Alex
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('marcus.security@campus.edu', 'AdminPass123!')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#FCF8F2] border border-[#DECBB6] font-bold text-[#1E1B18] hover:bg-[#EFE4D3] transition-colors shadow-2xs text-[11px] cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-[#D94825]" /> Admin Marcus
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {serverError && (
            <Alert type="error" message={serverError} onClose={() => setServerError(null)} />
          )}

          <Input
            label="College Email"
            type="email"
            required
            placeholder="student@campus.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Kiosk Password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="teal"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              loadingText="Accessing kiosk..."
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Sign In to Lost-Link
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-4 bg-[#EFE4D3]/40 border-t-2 border-dashed border-[#DECBB6] text-center text-xs font-mono text-[#6B6258]">
          Need a campus claim pass?{' '}
          <Link to="/register" className="font-bold text-[#0E6251] hover:underline">
            Register your Student ID
          </Link>
        </div>
      </div>
    </div>
  );
};
