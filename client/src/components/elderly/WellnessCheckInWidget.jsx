import React from 'react';
import { Heart, Smile, Droplets, CheckCircle2, Flame, Plus } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';

export const WellnessCheckInWidget = ({
  wellness,
  onFeelingSelect,
  onDrinkWater,
  isUltraAccessible = false,
}) => {
  const { success } = useToast();

  const feelings = [
    { id: 'great', label: 'Great', emoji: '😊', color: 'hover:border-emerald-500 hover:bg-emerald-50' },
    { id: 'good', label: 'Good', emoji: '🙂', color: 'hover:border-primary-500 hover:bg-primary-50' },
    { id: 'okay', label: 'Okay', emoji: '😐', color: 'hover:border-amber-500 hover:bg-amber-50' },
    { id: 'not-well', label: 'Not Well', emoji: '😟', color: 'hover:border-rose-500 hover:bg-rose-50' },
  ];

  const handleSelect = (fId, fLabel) => {
    onFeelingSelect(fId);
    success(
      'Daily Check-in Recorded! ⭐',
      `You shared that you are feeling "${fLabel}" today. Your care circle has been notified.`
    );
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 sm:p-8 shadow-card space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <h2
              className={`
                font-black text-slate-900 tracking-tight
                ${isUltraAccessible ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}
              `}
            >
              Daily Wellness Check-in
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              How are you feeling in your body and mind today?
            </p>
          </div>
        </div>

        {wellness?.streak && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
            <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
            <span>{wellness.streak}-Day Streak</span>
          </div>
        )}
      </div>

      {/* 4 Large Touch Emoji Cards */}
      <div>
        <p className="text-sm font-bold text-slate-800 mb-3">
          Tap the button that matches how you feel right now:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {feelings.map((f) => {
            const isSelected = wellness?.todayFeeling === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => handleSelect(f.id, f.label)}
                className={`
                  p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center
                  focus:outline-none focus-visible:ring-3 focus-visible:ring-primary-600
                  ${
                    isSelected
                      ? 'border-primary-700 bg-primary-50/80 ring-2 ring-primary-600/40 shadow-sm'
                      : 'border-slate-200 bg-warm-50/60 hover:border-slate-300'
                  }
                  ${f.color}
                `}
              >
                <span className="text-4xl sm:text-5xl">{f.emoji}</span>
                <span
                  className={`
                    font-black text-slate-900
                    ${isUltraAccessible ? 'text-xl' : 'text-base sm:text-lg'}
                  `}
                >
                  {f.label}
                </span>
                {isSelected && (
                  <span className="text-[11px] font-bold text-primary-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Water Hydration Counter */}
      <div className="p-4 sm:p-5 rounded-2xl bg-secondary-50/50 border border-secondary-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-secondary-200 text-secondary-900 flex items-center justify-center">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              Daily Hydration Goal: {wellness?.waterGlasses || 5} of {wellness?.waterTarget || 8} Glasses
            </h4>
            <p className="text-xs text-slate-500">
              Drinking water helps your body absorb your daily vitamins
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDrinkWater}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-white border border-secondary-300 text-secondary-900 hover:bg-secondary-100 transition-colors shadow-sm self-start sm:self-center"
        >
          <Plus className="w-4 h-4 text-secondary-700" />
          <span>+1 Glass of Water</span>
        </button>
      </div>
    </div>
  );
};

export default WellnessCheckInWidget;
