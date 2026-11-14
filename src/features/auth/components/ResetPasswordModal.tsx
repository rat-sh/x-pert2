'use client';

import { useState } from 'react';
import { KeyRound, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { ResetPasswordSchema } from '@/features/auth/schemas/auth.schema';
import { updatePassword } from '@/features/auth/services/auth.service';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  userRole?: 'teacher' | 'student';
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  onContinue,
  userRole = 'teacher',
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  if (!isOpen) return null;

  const validate = () => {
    const result = ResetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as 'password' | 'confirmPassword';
        if (field) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      toast.error(error.message ?? 'Failed to update password.');
      return;
    }

    toast.success('Password updated successfully!');
    setCompleted(true);
  };

  const isTeacher = userRole === 'teacher';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md border border-gray-100 relative overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isTeacher ? 'bg-indigo-600' : 'bg-green-600'}`} />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close reset password modal"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/>
          </svg>
        </button>

        {completed ? (
          <div className="text-center py-4 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full text-green-600 mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Password Updated!</h2>
            <p className="text-sm text-gray-600">
              Your password has been changed successfully. You can now continue to your dashboard.
            </p>
            <button
              type="button"
              onClick={onContinue}
              className={`w-full py-3 rounded-lg text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                isTeacher ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              Continue to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-3 ${
                isTeacher ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'
              }`}>
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Reset Your Password</h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter your new password below or skip to continue with your current session.
              </p>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    placeholder="At least 8 characters"
                    className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-sm text-gray-900 ${
                      isTeacher ? 'focus:ring-indigo-500' : 'focus:ring-green-500'
                    } ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-sm text-gray-900 ${
                      isTeacher ? 'focus:ring-indigo-500' : 'focus:ring-green-500'
                    } ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2.5 rounded-lg text-white font-medium text-sm transition-colors disabled:opacity-50 ${
                    isTeacher ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {loading ? 'Updating Password…' : 'Update Password & Continue'}
                </button>

                <button
                  type="button"
                  onClick={onContinue}
                  className="w-full py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  Skip & Continue to Dashboard
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
