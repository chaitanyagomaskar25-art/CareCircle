import React from 'react';
import { Pill, CheckCircle2, Clock, Volume2, Sun, Sunset, Moon } from 'lucide-react';
import Button from '../common/Button.jsx';
import StatusBadge from '../feedback/StatusBadge.jsx';
import { speak } from '../../utils/speech.js';

export const MedicationScheduleWidget = ({
  medications = [],
  onConfirmTaken,
  isUltraAccessible = false,
}) => {
  const timeSlotIcons = {
    Morning: '🌅',
    Afternoon: '☀️',
    Evening: '🌇',
    Night: '🌙',
  };

  const handleReadSchedule = () => {
    const speechLines = medications.map(
      (m) =>
        `${m.timeSlot} at ${m.scheduledTime}: ${m.name} ${m.dosage}. Status: ${
          m.status === 'taken' ? 'Already taken.' : 'Pending to be taken.'
        }`
    );
    speak(`Here is your medication schedule for today. ${speechLines.join('. ')}`);
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 sm:p-8 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-800 flex items-center justify-center font-bold">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h2
              className={`
                font-black text-slate-900 tracking-tight
                ${isUltraAccessible ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}
              `}
            >
              Today's Pill Box & Schedule
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review what pills to take throughout the day
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReadSchedule}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <Volume2 className="w-4 h-4 text-primary-700" />
          <span>Read Schedule Aloud</span>
        </button>
      </div>

      {/* Grid of Medications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medications.map((med) => {
          const isTaken = med.status === 'taken';
          const isDue = med.status === 'due';

          return (
            <div
              key={med.id}
              className={`
                p-5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-4
                ${
                  isTaken
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : isDue
                    ? 'border-amber-400 bg-amber-50/70 shadow-sm ring-2 ring-amber-300/40'
                    : 'border-slate-200 bg-warm-50/50 hover:border-slate-300'
                }
              `}
            >
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-3xl shrink-0">
                    {timeSlotIcons[med.timeSlot] || '💊'}
                  </span>
                  <div>
                    <h3
                      className={`
                        font-extrabold text-slate-900 leading-tight
                        ${isUltraAccessible ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}
                      `}
                    >
                      {med.name}
                    </h3>
                    <p className="text-sm font-bold text-primary-800">
                      Dosage: {med.dosage}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{med.timeSlot} • {med.scheduledTime}</span>
                    </p>
                  </div>
                </div>

                <StatusBadge
                  status={isTaken ? 'success' : isDue ? 'warning' : 'scheduled'}
                  label={isTaken ? 'Taken' : isDue ? 'Due Now' : 'Upcoming'}
                  size={isUltraAccessible ? 'lg' : 'md'}
                />
              </div>

              {/* Pill appearance & instructions */}
              <div className="p-3 rounded-xl bg-white/80 border border-slate-200/60 text-xs sm:text-sm text-slate-700 space-y-1">
                <p className="font-semibold text-slate-800">
                  {med.instructions}
                </p>
                <p className="text-slate-500 text-xs">
                  Appearance: <strong>{med.pillAppearance}</strong> ({med.mealRelation})
                </p>
              </div>

              {/* Confirmation Button */}
              <div className="pt-1">
                {isTaken ? (
                  <div className="w-full py-3 px-4 rounded-xl bg-emerald-100 text-emerald-900 text-sm font-bold flex items-center justify-center gap-2 border border-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <span>Taken at {med.takenAt}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onConfirmTaken(med.id)}
                    className={`
                      w-full py-3.5 px-4 rounded-xl font-bold text-white transition-all shadow-sm
                      focus:outline-none focus-visible:ring-3
                      ${
                        isDue
                          ? 'bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-base min-h-[56px] focus-visible:ring-amber-500'
                          : 'bg-primary-700 hover:bg-primary-800 text-white min-h-[50px] focus-visible:ring-primary-600'
                      }
                    `}
                  >
                    ✓ MARK AS TAKEN
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MedicationScheduleWidget;
