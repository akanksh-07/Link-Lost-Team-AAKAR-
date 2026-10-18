import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Hash, Phone, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Input } from '../components/Input.tsx';
import { Button } from '../components/Button.tsx';
import { Alert } from '../components/Alert.tsx';
import { validateRegistration } from '../lib/validation.ts';
import { LostLinkLogoMark, LostLinkWordmark } from '../components/Logo.tsx';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    collegeEmail: '',
    rollNumber: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validation = validateRegistration(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setIsLoading(true);

    const { error } = await register({
      fullName: formData.fullName,
      collegeEmail: formData.collegeEmail,
      rollNumber: formData.rollNumber,
      phoneNumber: formData.phoneNumber,
      password: formData.password,
    });
    setIsLoading(false);

    if (error) {
      setServerError(error.message || 'Registration failed. A student with this email may already be linked.');
    } else {
      navigate('/items', { replace: true });
    }
  };

  return (
    <div className="max-w-xl mx-auto my-6 sm:my-10">
      <div className="bg-[#FCF8F2] rounded-3xl border-3 border-[#DECBB6] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b-2 border-dashed border-[#DECBB6] bg-[#EFE4D3]/50 text-center">
          <div className="flex justify-center mb-3">
            <LostLinkLogoMark size={44} />
          </div>
          <LostLinkWordmark size="lg" className="justify-center" />
          <h2 className="text-xl font-display font-extrabold text-[#1E1B18] mt-2">
            Create Campus Claim ID
          </h2>
          <p className="font-mono text-xs text-[#8C6D4F] mt-1 uppercase tracking-wider font-bold">
            [COLLEGE NAME] · Lost &amp; Found Registry
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {serverError && (
            <Alert type="error" message={serverError} onClose={() => setServerError(null)} />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Student / Faculty Full Name"
              name="fullName"
              required
              placeholder="e.g. Jordan Lee"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              label="College Email"
              name="collegeEmail"
              type="email"
              required
              placeholder="j.lee@campus.edu"
              value={formData.collegeEmail}
              onChange={handleChange}
              error={errors.collegeEmail}
              leftIcon={<Mail className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Roll Number / Student ID"
              name="rollNumber"
              required
              placeholder="e.g. 2024CS089"
              value={formData.rollNumber}
              onChange={handleChange}
              error={errors.rollNumber}
              leftIcon={<Hash className="w-4 h-4" />}
            />

            <Input
              label="Contact Phone Number"
              name="phoneNumber"
              type="tel"
              placeholder="+1 (555) 012-3456"
              value={formData.phoneNumber}
              onChange={handleChange}
              error={errors.phoneNumber}
              leftIcon={<Phone className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Password (min 8 chars)"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              required
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              leftIcon={<Lock className="w-4 h-4" />}
            />
          </div>

          <div className="pt-3">
            <Button
              type="submit"
              variant="teal"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              loadingText="Linking new student pass..."
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Issue My Lost-Link ID Pass
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-4 bg-[#EFE4D3]/40 border-t-2 border-dashed border-[#DECBB6] text-center text-xs font-mono text-[#6B6258]">
          Already have a claim pass?{' '}
          <Link to="/login" className="font-bold text-[#0E6251] hover:underline">
            Sign In at Kiosk
          </Link>
        </div>
      </div>
    </div>
  );
};
