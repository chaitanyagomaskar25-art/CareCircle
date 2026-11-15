import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button.jsx';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop = true,
  isElderly = false,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={closeOnBackdrop ? onClose : undefined}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Dialog Frame */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`
            w-full ${sizeClasses[size] || sizeClasses.md}
            transform overflow-hidden rounded-3xl bg-white text-left align-middle shadow-2xl transition-all
            border border-slate-200/80
            ${isElderly ? 'border-4 border-primary-700' : ''}
          `}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
            <div>
              <h3
                id="modal-title"
                className={`${isElderly ? 'text-2xl font-bold' : 'text-lg font-bold'} text-slate-900`}
              >
                {title}
              </h3>
              {subtitle && (
                <p className={`${isElderly ? 'text-base font-medium' : 'text-xs sm:text-sm'} text-slate-500 mt-1`}>
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
            {children}
          </div>

          {/* Footer Actions */}
          {footer && (
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 p-4 sm:p-6 rounded-b-3xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
