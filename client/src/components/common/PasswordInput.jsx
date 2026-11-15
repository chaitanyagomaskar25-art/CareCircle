import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, Lock, AlertCircle, Check } from 'lucide-react';

export const PasswordInput = forwardRef(({
  label = 'Password',
  id,
  name = 'password',
  value = '',
  onChange,
  placeholder = '••••••••••••',
  error,
  helperText,
  required = false,
  showStrengthMeter = false,
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const sizeClasses = {
    md: 'py-2.5 pl-10 pr-11 text-sm min-h-[44px]',
    lg: 'py-3.5 pl-11 pr-12 text-base font-medium min-h-[52px]',
  };

  // Password strength calculation
  const calculateStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score; // 0 to 5
  };

  const strength = calculateStrength(value);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = ['bg-slate-200', 'bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-emerald-600'];

  const hasError = Boolean(error);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-800 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-sm">
        {/* Leading Lock Icon */}
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Lock className="w-5 h-5" />
        </div>

        {/* Input Field */}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          className={`
            block w-full rounded-xl border transition-colors
            text-slate-900 placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-offset-1
            ${sizeClasses[size] || sizeClasses.md}
            ${
              hasError
                ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                : 'border-slate-300 bg-white hover:border-slate-400 focus:border-primary-600 focus:ring-primary-600'
            }
          `}
          {...props}
        />

        {/* Visibility Toggle Button */}
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-r-xl"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {/* Optional Password Strength Indicator */}
      {showStrengthMeter && value.length > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <div
                key={lvl}
                className={`h-full flex-1 rounded-full transition-colors ${
                  strength >= lvl ? strengthColors[strength] : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] font-semibold text-slate-500 flex justify-between">
            <span>Password Security:</span>
            <span className={strength >= 4 ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
              {strengthLabels[strength]}
            </span>
          </p>
        </div>
      )}

      {hasError && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {!hasError && helperText && (
        <p id={helperId} className="mt-1.5 text-xs text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';
export default PasswordInput;
