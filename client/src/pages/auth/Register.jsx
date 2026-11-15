import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Heart, Users, Stethoscope, ArrowRight, Sparkles } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import PasswordInput from '../../components/common/PasswordInput.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const { success, error: toastError } = useToast();

  const [role, setRole] = useState('family'); // 'elderly' | 'family' | 'caregiver'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    preferredName: '',
    emergencyContact: '',
    relation: 'Daughter',
    organization: '',
    license: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});

  const roleOptions = [
    {
      id: 'elderly',
      title: 'Senior / Resident',
      desc: 'Seeking large-button reminders & safety',
      icon: Heart,
    },
    {
      id: 'family',
      title: 'Family Member',
      desc: 'Monitoring a parent or loved one',
      icon: Users,
    },
    {
      id: 'caregiver',
      title: 'Caregiver / Nurse',
      desc: 'Healthcare staff or home health aide',
      icon: Stethoscope,
    },
  ];

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
    if (!formData.name.trim()) errs.name = 'Full name is required.';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    if (!formData.agreeTerms) {
      errs.agreeTerms = 'You must agree to the Terms of Service & Privacy Policy.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register({ ...formData, role });
      success(
        'Account Registered!',
        `A 6-digit confirmation code has been generated for ${formData.email}.`
      );
      navigate('/verify-email');
    } catch (err) {
      toastError('Registration Failed', err.message || 'Please try again.');
    }
  };

  // Demo autofill for rapid review
  const handleAutofill = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'elderly') {
      setFormData({
        name: 'Eleanor Vance',
        email: 'eleanor.new@carecircle.org',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phone: '+1 (555) 123-4567',
        preferredName: 'Grandma Eleanor',
        emergencyContact: '+1 (555) 234-8901 (Sarah Vance)',
        relation: '',
        organization: '',
        license: '',
        agreeTerms: true,
      });
    } else if (selectedRole === 'caregiver') {
      setFormData({
        name: 'Marcus Bell',
        email: 'marcus.rn@carecircle.org',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phone: '+1 (555) 456-7890',
        preferredName: '',
        emergencyContact: '',
        relation: '',
        organization: 'Oakridge Senior Health Services',
        license: 'RN-908123',
        agreeTerms: true,
      });
    } else {
      setFormData({
        name: 'Sarah Vance',
        email: 'sarah.vance@carecircle.org',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phone: '+1 (555) 234-8901',
        preferredName: '',
        emergencyContact: '',
        relation: 'Daughter (Primary Caregiver)',
        organization: '',
        license: '',
        agreeTerms: true,
      });
    }
    setErrors({});
  };

  return (
    <AuthLayout
      title="Create Your CareCircle Account"
      subtitle="Select your role to configure tailored medication tracking and notifications."
      badgeText="Patient & Family Registration"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Role Selector Tabs */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            I am joining CareCircle as a:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {roleOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = role === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRole(opt.id)}
                  className={`
                    p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between
                    ${
                      isSelected
                        ? 'border-primary-700 bg-primary-50/70 ring-2 ring-primary-600/30 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }
                  `}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${isSelected ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">{opt.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Demo Quick Fill Toolbar */}
        <div className="flex items-center gap-2 p-2.5 bg-warm-50 rounded-xl border border-slate-200/80 text-xs">
          <Sparkles className="w-4 h-4 text-primary-700 shrink-0" />
          <span className="font-semibold text-slate-700">Quick Test Fill:</span>
          <button
            type="button"
            onClick={() => handleAutofill('elderly')}
            className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 font-medium text-slate-700"
          >
            Senior (Eleanor)
          </button>
          <button
            type="button"
            onClick={() => handleAutofill('family')}
            className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 font-medium text-slate-700"
          >
            Family (Sarah)
          </button>
          <button
            type="button"
            onClick={() => handleAutofill('caregiver')}
            className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 font-medium text-slate-700"
          >
            Caregiver (Nurse)
          </button>
        </div>

        {/* Base Profile Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Legal Name"
            name="name"
            placeholder="e.g. Eleanor Vance"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            icon={User}
          />
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
        </div>

        {/* Role-Specific Fields */}
        {role === 'elderly' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-primary-50/50 border border-primary-200/60">
            <Input
              label="What should we call you?"
              name="preferredName"
              placeholder="e.g. Grandma Eleanor"
              value={formData.preferredName}
              onChange={handleChange}
              helperText="Displayed in large text on your daily screen"
            />
            <Input
              label="Primary Emergency Phone"
              name="emergencyContact"
              placeholder="+1 (555) 234-8901 (Daughter)"
              value={formData.emergencyContact}
              onChange={handleChange}
              icon={Phone}
              helperText="Called first when SOS button is pressed"
            />
          </div>
        )}

        {role === 'family' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-secondary-50/50 border border-secondary-200/60">
            <Select
              label="Relationship to Senior"
              name="relation"
              value={formData.relation}
              onChange={handleChange}
              options={[
                { value: 'Daughter', label: 'Daughter' },
                { value: 'Son', label: 'Son' },
                { value: 'Spouse', label: 'Spouse / Partner' },
                { value: 'Grandchild', label: 'Grandchild' },
                { value: 'Legal Guardian', label: 'Legal Guardian' },
              ]}
              required
            />
            <Input
              label="Your Mobile Phone"
              name="phone"
              placeholder="+1 (555) 234-8901"
              value={formData.phone}
              onChange={handleChange}
              icon={Phone}
              helperText="For urgent missed medication SMS alerts"
            />
          </div>
        )}

        {role === 'caregiver' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60">
            <Input
              label="Healthcare Facility / Agency"
              name="organization"
              placeholder="e.g. Oakridge Home Health"
              value={formData.organization}
              onChange={handleChange}
              required
            />
            <Input
              label="License or Credential ID"
              name="license"
              placeholder="e.g. RN-908123 or CNA"
              value={formData.license}
              onChange={handleChange}
              helperText="For physician verified chart sync"
            />
          </div>
        )}

        {/* Password Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PasswordInput
            label="Create Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            showStrengthMeter
            required
          />
          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
          />
        </div>

        {/* Terms Checkbox */}
        <div>
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
            <input
              type="checkbox"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              className="mt-0.5 w-4 h-4 rounded text-primary-700 focus:ring-primary-600 border-slate-300"
            />
            <span>
              I agree to the CareCircle{' '}
              <a href="#terms" className="text-primary-800 font-semibold underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" className="text-primary-800 font-semibold underline">
                HIPAA Privacy Policy
              </a>
              .
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="text-xs text-rose-600 font-medium mt-1">{errors.agreeTerms}</p>
          )}
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
          Create CareCircle Account
        </Button>

        {/* Login redirect link */}
        <p className="text-center text-xs text-slate-500 pt-2">
          Already have a CareCircle account?{' '}
          <Link to="/login" className="font-bold text-primary-700 hover:text-primary-800 hover:underline">
            Sign In here
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;
