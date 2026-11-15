import React, { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

export const Select = forwardRef(({
  label,
  id,
  name,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  helperText,
  required = false,
  disabled = false,
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const selectId = id || name || Math.random().toString(36).substring(2, 9);
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  const sizeClasses = {
    md: 'py-2.5 pl-3.5 pr-10 text-sm min-h-[44px]',
    lg: 'py-3.5 pl-4 pr-11 text-base font-medium min-h-[52px]',
  };

  const hasError = Boolean(error);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-semibold text-slate-800 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-sm">
        <select
          ref={ref}
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          className={`
            block w-full appearance-none rounded-xl border transition-colors
            text-slate-900 bg-white
            focus:outline-none focus:ring-2 focus:ring-offset-1
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${sizeClasses[size] || sizeClasses.md}
            ${
              hasError
                ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                : 'border-slate-300 hover:border-slate-400 focus:border-primary-600 focus:ring-primary-600'
            }
          `}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {lbl}
              </option>
            );
          })}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>

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

Select.displayName = 'Select';
export default Select;
