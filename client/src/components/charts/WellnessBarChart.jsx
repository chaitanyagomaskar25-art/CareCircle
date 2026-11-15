import React from 'react';

export const WellnessBarChart = ({ checkIns = [] }) => {
  if (!checkIns || checkIns.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
        No wellness check-ins recorded yet.
      </div>
    );
  }

  const feelingMeta = {
    great: { label: 'Great', emoji: '😊', color: 'bg-emerald-500', heightPercent: 100 },
    good: { label: 'Good', emoji: '🙂', color: 'bg-primary-500', heightPercent: 75 },
    okay: { label: 'Okay', emoji: '😐', color: 'bg-amber-500', heightPercent: 50 },
    'not-well': { label: 'Not Well', emoji: '😟', color: 'bg-rose-500', heightPercent: 25 },
  };

  // Chronological ascending
  const items = [...checkIns]
    .slice(0, 7)
    .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2 h-36 pt-4 px-2">
        {items.map((item, idx) => {
          const feelingKey = item.value || item.feeling || 'good';
          const meta = feelingMeta[feelingKey] || feelingMeta.good;
          const dateStr = new Date(item.recordedAt).toLocaleDateString([], {
            weekday: 'short',
            month: 'numeric',
            day: 'numeric',
          });

          return (
            <div
              key={item._id || idx}
              className="flex-1 flex flex-col items-center justify-end h-full group relative"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                {meta.label} • {new Date(item.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>

              <span className="text-lg mb-1">{meta.emoji}</span>
              <div className="w-full max-w-[28px] bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-20">
                <div
                  className={`w-full rounded-t-lg transition-all ${meta.color}`}
                  style={{ height: `${meta.heightPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-slate-500 mt-2 truncate w-full text-center">
                {dateStr}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Great
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-500" /> Good
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Okay
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Not Well
        </span>
      </div>
    </div>
  );
};

export default WellnessBarChart;
