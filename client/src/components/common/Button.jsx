import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Accessible Button component designed for healthcare usability.
 * Supports standard and high-accessibility elderly touch targets.
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  ariaLabel,
}) => {
  const isDisabled = disabled || isLoading;

  // Base styles prioritizing readability, focus clarity, and touch targets
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-offset-2';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[36px]',
    md: 'text-sm px-4 py-2.5 gap-2 min-h-[44px]', // WCAG AAA standard touch target
    lg: 'text-base px-5 py-3 gap-2.5 min-h-[50px] font-semibold',
    xl: 'text-lg px-6 py-4 gap-3 min-h-[60px] font-bold tracking-wide rounded-2xl shadow-md', // Elderly-optimized
  };

  const variantStyles = {
    // Primary: Deep calming teal
    primary: 'bg-primary-700 hover:bg-primary-800 active:bg-primary-900 text-white shadow-sm hover:shadow focus-visible:ring-primary-600',
    // Secondary: Soft trusting blue
    secondary: 'bg-secondary-600 hover:bg-secondary-700 active:bg-secondary-800 text-white shadow-sm focus-visible:ring-secondary-500',
    // Outline: High contrast border with white surface
    outline: 'border-2 border-slate-300 hover:border-slate-400 active:border-slate-500 bg-white hover:bg-slate-50 text-slate-800 focus-visible:ring-primary-600',
    // Danger: Clear emergency rose
    danger: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm focus-visible:ring-rose-500',
    // Soft/Subtle: Slate background
    soft: 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 focus-visible:ring-slate-400',
    // Ghost: Clean text with hover fill
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 focus-visible:ring-slate-400 shadow-none',
  };

  const disabledStyles = isDisabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : '';

  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${widthStyles} ${disabledStyles} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-5 h-5 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-5 h-5 shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;
