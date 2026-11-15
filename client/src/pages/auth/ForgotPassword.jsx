import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, isLoading } = useAuth();
  const { success } = useToast();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    await forgotPassword(email);
    setIsSent(true);
    success('Reset Link Dispatched', `Password instructions sent to ${email}`);
  };

  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Enter the verified email linked to your CareCircle account to receive reset instructions."
      badgeText="Account Recovery"
    >
      {isSent ? (
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">Check Your Inbox</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              We have dispatched a secure password reset link to{' '}
              <strong className="text-slate-800">{email}</strong>. Please check your inbox or spam folder.
            </p>
          </div>

          <div className="p-4 bg-warm-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600">
            <span>Demo Shortcut: </span>
            <Link
              to="/reset-password"
              className="font-bold text-primary-700 hover:text-primary-800 underline"
            >
              Click here to proceed directly to Reset Password screen →
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setIsSent(false)}
            >
              Re-enter Email Address
            </Button>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Account Email Address"
            name="email"
            type="email"
            placeholder="name@carecircle.org"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            error={error}
            required
            icon={Mail}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            icon={ArrowRight}
            iconPosition="right"
            isLoading={isLoading}
          >
            Send Reset Instructions
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Remembered password? Back to Login</span>
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
