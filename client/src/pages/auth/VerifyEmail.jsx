import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2, RefreshCw, ArrowRight, Sparkles } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export const VerifyEmail = () => {
  const navigate = useNavigate();
  const { verifyEmail, pendingVerificationEmail, isLoading } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(45);
  const inputRefs = useRef([]);

  const displayEmail = pendingVerificationEmail || 'your email';

  // Resend timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1); // Take only latest char
    setDigits(newDigits);

    // Auto focus next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(paste)) {
      const split = paste.split('');
      setDigits(split);
      inputRefs.current[5]?.focus();
    }
  };

  const handleAutofill = () => {
    setDigits(['1', '2', '3', '4', '5', '6']);
    info('Code Auto-Filled', 'Test code 123456 inserted.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      toastError('Incomplete Code', 'Please enter all 6 digits of your verification code.');
      return;
    }

    try {
      await verifyEmail(code);
      success('Email Verified!', 'Your CareCircle account is active. Welcome!');
      navigate('/app');
    } catch (err) {
      toastError('Verification Failed', err.message);
    }
  };

  const handleResend = () => {
    setResendCooldown(45);
    info('New Code Sent', `A fresh 6-digit verification code has been dispatched to ${displayEmail}.`);
  };

  return (
    <AuthLayout
      title="Verify Your Email Address"
      subtitle={`We have dispatched a 6-digit verification code to ${displayEmail}. Enter it below to activate your account.`}
      badgeText="Security Verification"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quick Demo Helper */}
        <div className="flex items-center justify-between p-3 bg-warm-50 rounded-2xl border border-slate-200/80 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Sparkles className="w-4 h-4 text-primary-700" />
            <span>Test Mode: Any 6 digits (or use demo code)</span>
          </div>
          <button
            type="button"
            onClick={handleAutofill}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-primary-800"
          >
            Fill "123456"
          </button>
        </div>

        {/* 6 Digit Input Boxes */}
        <div>
          <label className="block text-center text-sm font-semibold text-slate-800 mb-3">
            Enter 6-Digit Verification Code
          </label>
          <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                aria-label={`Digit ${idx + 1}`}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-2xl border-2 border-slate-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20 text-slate-900 bg-white transition-all shadow-sm outline-none"
              />
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          icon={ArrowRight}
          iconPosition="right"
          isLoading={isLoading}
        >
          Confirm Code & Enter CareCircle
        </Button>

        {/* Resend Section */}
        <div className="text-center text-xs text-slate-500 space-y-2 pt-2">
          <p>
            Didn't receive the email code?{' '}
            {resendCooldown > 0 ? (
              <span className="font-semibold text-slate-700">
                Resend in {resendCooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="font-bold text-primary-700 hover:text-primary-800 underline"
              >
                Resend verification code
              </button>
            )}
          </p>
          <p>
            <Link to="/register" className="font-medium text-slate-500 hover:text-slate-800">
              Entered wrong email? Start over
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default VerifyEmail;
