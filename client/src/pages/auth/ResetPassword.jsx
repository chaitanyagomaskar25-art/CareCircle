import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import PasswordInput from '../../components/common/PasswordInput.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const { resetPassword, isLoading } = useAuth();
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.password) {
      errs.password = 'New password is required.';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await resetPassword(formData.password);
      success(
        'Password Reset Complete',
        'Your password has been securely updated. Please log in with your new credentials.'
      );
      navigate('/login');
    } catch (err) {
      toastError('Reset Failed', err.message);
    }
  };

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Ensure your new password contains at least 8 characters including letters and numbers."
      badgeText="Credential Update"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <PasswordInput
          label="New Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          showStrengthMeter
          required
        />

        <PasswordInput
          label="Confirm New Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
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
          Update Password & Sign In
        </Button>

        <p className="text-center text-xs text-slate-500 pt-2">
          Remember your old password?{' '}
          <Link to="/login" className="font-bold text-primary-700 hover:text-primary-800 hover:underline">
            Back to Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
