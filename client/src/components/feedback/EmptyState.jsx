import React from 'react';
import { FileQuestion } from 'lucide-react';
import Button from '../common/Button.jsx';

export const EmptyState = ({
  icon: Icon = FileQuestion,
  title = 'No records found',
  description = 'There are no active records in this section right now.',
  actionLabel,
  onAction,
  actionIcon,
  className = '',
  isElderly = false,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4 border border-slate-200">
        <Icon className="w-8 h-8" />
      </div>

      <h3 className={`${isElderly ? 'text-2xl font-bold' : 'text-base font-semibold'} text-slate-800 mb-1.5`}>
        {title}
      </h3>

      <p className={`${isElderly ? 'text-base' : 'text-sm'} text-slate-500 max-w-sm mb-6 leading-relaxed`}>
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          variant="primary"
          size={isElderly ? 'lg' : 'md'}
          icon={actionIcon}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
