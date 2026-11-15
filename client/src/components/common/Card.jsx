import React from 'react';

/**
 * Reusable Card component designed for clean white surfaces and subtle healthcare borders.
 */
export const Card = ({
  children,
  className = '',
  title,
  subtitle,
  icon: Icon,
  badge,
  action,
  footer,
  padding = 'md', // 'none' | 'sm' | 'md' | 'lg'
  isElderly = false,
  onClick,
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const elderlyStyles = isElderly
    ? 'border-2 border-slate-300 shadow-elderly rounded-3xl'
    : 'border border-slate-200/80 shadow-card hover:shadow-card-hover rounded-2xl';

  const interactiveStyles = onClick ? 'cursor-pointer transition-transform active:scale-[0.99]' : '';

  return (
    <div
      onClick={onClick}
      className={`bg-white transition-all ${elderlyStyles} ${interactiveStyles} ${className}`}
    >
      {(title || subtitle || action || Icon || badge) && (
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                {title && (
                  <h3 className={`${isElderly ? 'text-xl' : 'text-base sm:text-lg'} font-bold text-slate-900`}>
                    {title}
                  </h3>
                )}
                {badge && <div>{badge}</div>}
              </div>
              {subtitle && (
                <p className={`${isElderly ? 'text-base' : 'text-xs sm:text-sm'} text-slate-500 mt-0.5`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={paddingClasses[padding]}>{children}</div>

      {footer && (
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50/80 rounded-b-2xl border-t border-slate-100">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
