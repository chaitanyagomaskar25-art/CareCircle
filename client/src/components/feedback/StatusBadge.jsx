import React from 'react';

/**
 * Accessible StatusBadge for medication schedule and caregiver monitoring.
 */
export const StatusBadge = ({
  status = 'neutral',
  label,
  size = 'md', // 'sm' | 'md' | 'lg'
  dot = true,
  className = '',
}) => {
  const normalized = String(status).toLowerCase();

  // High-contrast, WCAG-compliant styling maps
  const colorMap = {
    // Taken / Healthy / Connected
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    taken: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    healthy: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    active: 'bg-emerald-50 text-emerald-800 border-emerald-300',

    // Pending / Due Soon / Warning
    warning: 'bg-amber-50 text-amber-900 border-amber-300',
    pending: 'bg-amber-50 text-amber-900 border-amber-300',
    due: 'bg-amber-50 text-amber-900 border-amber-300',

    // Missed / Critical / Error
    danger: 'bg-rose-50 text-rose-800 border-rose-300',
    missed: 'bg-rose-50 text-rose-800 border-rose-300',
    critical: 'bg-rose-50 text-rose-800 border-rose-300',
    error: 'bg-rose-50 text-rose-800 border-rose-300',

    // Scheduled / Info
    info: 'bg-secondary-50 text-secondary-900 border-secondary-300',
    scheduled: 'bg-secondary-50 text-secondary-900 border-secondary-300',

    // Neutral / Inactive
    neutral: 'bg-slate-100 text-slate-700 border-slate-300',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  const dotColorMap = {
    success: 'bg-emerald-600',
    taken: 'bg-emerald-600',
    healthy: 'bg-emerald-600',
    active: 'bg-emerald-600',
    warning: 'bg-amber-600',
    pending: 'bg-amber-600',
    due: 'bg-amber-600',
    danger: 'bg-rose-600',
    missed: 'bg-rose-600',
    critical: 'bg-rose-600',
    error: 'bg-rose-600',
    info: 'bg-secondary-600',
    scheduled: 'bg-secondary-600',
    neutral: 'bg-slate-500',
    inactive: 'bg-slate-500',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5 font-medium',
    md: 'text-xs px-2.5 py-1 gap-2 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5 font-bold', // Elderly-readable
  };

  const activeStyle = colorMap[normalized] || colorMap.neutral;
  const dotColor = dotColorMap[normalized] || dotColorMap.neutral;

  return (
    <span
      className={`
        inline-flex items-center rounded-full border shrink-0
        ${activeStyle}
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
    >
      {dot && <span className={`w-2 h-2 rounded-full ${dotColor}`} aria-hidden="true" />}
      <span>{label || status}</span>
    </span>
  );
};

export default StatusBadge;
