import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export const Input = forwardRef(({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  size = 'md', // 'md' | 'lg'
  className = '',
  ...props
}, ref) => {
  const inputId = id || name || Math.random().toString(36).substring(2, 9);
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const sizeClasses = {
    md: 'py-2.5 px-3.5 text-sm min-h-[44px]',
    lg: 'py-3.5 px-4 text-base font-medium min-h-[52px]', // Elderly-friendly
  };

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
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-5 h-5" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          className={`
            block w-full rounded-xl border transition-colors
            text-slate-900 placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-offset-1
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${Icon ? 'pl-11' : ''}
            ${sizeClasses[size] || sizeClasses.md}
            ${
              hasError
                ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                : 'border-slate-300 bg-white hover:border-slate-400 focus:border-primary-600 focus:ring-primary-600'
            }
          `}
          {...props}
        />

        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-rose-500">
            <AlertCircle className="w-5 h-5" />
          </div>
        )}
      </div>

      {hasError && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1">
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

Input.displayName = 'Input';
export default Input;
