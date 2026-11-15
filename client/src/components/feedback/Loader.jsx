import React from 'react';

/**
 * Animated loader component.
 */
export const Loader = ({ size = 'md', text = 'Loading...' }) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-3">
      <div
        className={`${sizeMap[size]} border-slate-200 border-t-emerald-600 rounded-full animate-spin`}
      />
      {text && <p className="text-sm text-slate-500 font-medium">{text}</p>}
    </div>
  );
};

export default Loader;
