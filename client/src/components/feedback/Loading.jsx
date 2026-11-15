import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Loading component supporting full spinner state or skeleton placeholders.
 */
export const Loading = ({
  text = 'Loading CareCircle data...',
  type = 'spinner', // 'spinner' | 'skeleton' | 'cards'
  count = 3,
  size = 'md',
}) => {
  if (type === 'skeleton') {
    return (
      <div className="space-y-4 w-full animate-pulse">
        <div className="h-6 bg-slate-200 rounded-lg w-1/3" />
        <div className="space-y-2.5">
          <div className="h-4 bg-slate-100 rounded-md w-full" />
          <div className="h-4 bg-slate-100 rounded-md w-5/6" />
          <div className="h-4 bg-slate-100 rounded-md w-2/3" />
        </div>
      </div>
    );
  }

  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-xl" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
            <div className="h-16 bg-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="p-3 bg-primary-50 rounded-2xl text-primary-700 mb-3">
        <Loader2 className={`${sizeClasses[size] || sizeClasses.md} animate-spin`} />
      </div>
      <p className="text-sm font-medium text-slate-700">{text}</p>
      <p className="text-xs text-slate-400 mt-1">Please wait a moment</p>
    </div>
  );
};

export default Loading;
