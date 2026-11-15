import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import Input from '../../components/common/Input.jsx';
import PasswordInput from '../../components/common/PasswordInput.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useViewMode } from '../../context/ViewModeContext.jsx';

export const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, demoUsers } = useAuth();
  const { success, error: toastError } = useToast();
  const { setViewMode } = useViewMode();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.password) {
      errs.password = 'Password is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const loggedIn = await login({
        email: formData.email,
        password: formData.password,
      });

      // Synchronize UI view mode with the user's role
      if (loggedIn.role === 'elderly') {
        setViewMode('elderly');
      } else {
        setViewMode('caregiver');
      }

      success(
        `Welcome back, ${loggedIn.preferredName || loggedIn.name}!`,
        'Session authenticated successfully.'
      );
      navigate('/app');
    } catch (err) {
      toastError('Login Failed', err.message || 'Invalid credentials provided.');
    }
  };

  // Quick One-Click Demo Logins
  const handleDemoLogin = async (demoUser) => {
    setFormData({
      email: demoUser.email,
      password: 'Password123!',
      rememberMe: true,
    });

    try {
      const loggedIn = await login({
        email: demoUser.email,
        password: 'Password123!',
        role: demoUser.role,
      });

      if (loggedIn.role === 'elderly') {
        setViewMode('elderly');
      } else {
        setViewMode('caregiver');
      }

      success(
        `Signed in as ${demoUser.name}`,
        `Switched to ${demoUser.role === 'elderly' ? 'Elderly Simplified View' : 'Caregiver Dashboard'}.`
      );
      navigate('/app');
    } catch (err) {
      toastError('Login Error', err.message);
    }
  };

  return (
    <AuthLayout
      title="Sign In to SeniSync"
      subtitle="Access resident medication schedules, vital health metrics, and caregiver circles."
      badgeText="Secure Member Portal"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Quick Demo Logins Bar */}
        <div className="p-4 bg-warm-50 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-800">
            <Sparkles className="w-4 h-4 text-primary-700" />
            <span>Instant Demo Sign-In (Select Role):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin(demoUsers[0])}
              className="px-3 py-2 text-left rounded-xl bg-white border border-slate-200 hover:border-primary-600 hover:bg-primary-50/50 transition-all text-xs"
            >
              <span className="font-bold text-slate-900 block truncate">Grandma Eleanor</span>
              <span className="text-[11px] text-primary-700 font-semibold">Elderly View</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin(demoUsers[1])}
              className="px-3 py-2 text-left rounded-xl bg-white border border-slate-200 hover:border-primary-600 hover:bg-primary-50/50 transition-all text-xs"
            >
              <span className="font-bold text-slate-900 block truncate">Sarah Vance</span>
              <span className="text-[11px] text-secondary-700 font-semibold">Family Caregiver</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin(demoUsers[2])}
              className="px-3 py-2 text-left rounded-xl bg-white border border-slate-200 hover:border-primary-600 hover:bg-primary-50/50 transition-all text-xs"
            >
              <span className="font-bold text-slate-900 block truncate">Marcus Bell, RN</span>
              <span className="text-[11px] text-emerald-700 font-semibold">Nurse Caregiver</span>
            </button>
          </div>
        </div>

        {/* Email Input */}
        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="name@carecircle.org"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
          icon={Mail}
        />

        {/* Password Input */}
        <div>
          <PasswordInput
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
          />
          <div className="flex items-center justify-between mt-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 rounded text-primary-700 focus:ring-primary-600 border-slate-300"
              />
              <span>Remember this device</span>
            </label>
            <Link
              to="/forgot-password"
              className="font-semibold text-primary-700 hover:text-primary-800 hover:underline"
            >
              Forgot password?
            </Link>
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
          Sign In to Platform
        </Button>

        {/* Register prompt */}
        <p className="text-center text-xs text-slate-500 pt-3">
          New to CareCircle?{' '}
          <Link to="/register" className="font-bold text-primary-700 hover:text-primary-800 hover:underline">
            Register your family circle
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;
