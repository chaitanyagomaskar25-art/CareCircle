import React from 'react';
import { Clock, ShieldCheck, Heart, Pill, Bell } from 'lucide-react';

export const RecentActivityWidget = ({
  activities = [],
  isUltraAccessible = false,
}) => {
  const getIcon = (type) => {
    switch (type) {
      case 'medication':
        return <Pill className="w-4 h-4 text-emerald-700" />;
      case 'wellness':
        return <Heart className="w-4 h-4 text-rose-600" />;
      case 'vital':
        return <ShieldCheck className="w-4 h-4 text-secondary-700" />;
      default:
        return <Bell className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 sm:p-8 shadow-card space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-warm-100 text-slate-800 flex items-center justify-center font-bold">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h2
            className={`
              font-black text-slate-900 tracking-tight
              ${isUltraAccessible ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}
            `}
          >
            Recent Care Activity
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Confirmed events between you and your care team
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {activities.slice(0, 4).map((act) => (
          <div
            key={act.id}
            className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-warm-50/70 border border-slate-200/70"
          >
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0 border border-slate-200/60">
              {getIcon(act.type)}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`
                  font-bold text-slate-900 truncate
                  ${isUltraAccessible ? 'text-base sm:text-lg' : 'text-sm'}
                `}
              >
                {act.action}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {act.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivityWidget;
