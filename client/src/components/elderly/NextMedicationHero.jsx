import React, { useState } from 'react';
import { CheckCircle2, Clock, Volume2, AlertCircle, Sparkles, Check } from 'lucide-react';
import Button from '../common/Button.jsx';
import StatusBadge from '../feedback/StatusBadge.jsx';
import { speak, stopSpeech } from '../../utils/speech.js';

export const NextMedicationHero = ({
  medication,
  onConfirmTaken,
  onSnooze,
  isUltraAccessible = false,
}) => {
  const [isSpeakingMed, setIsSpeakingMed] = useState(false);

  // If no due or upcoming medication, show celebratory card
  if (!medication || medication.status === 'taken') {
    return (
      <div className="bg-emerald-50 rounded-3xl border-4 border-emerald-300 p-6 sm:p-10 text-center shadow-card">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center mx-auto mb-3 shadow-sm">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-emerald-950">
          All Caught Up on Today's Pills! ⭐
        </h2>
        <p className="text-base sm:text-lg text-emerald-800 mt-1 max-w-md mx-auto">
          Wonderful job! You have taken all medications scheduled for right now. Your next pill will be highlighted here when due.
        </p>
      </div>
    );
  }

  const isDueNow = medication.status === 'due';

  const handleReadMedAloud = () => {
    if (isSpeakingMed) {
      stopSpeech();
      setIsSpeakingMed(false);
      return;
    }

    const ttsText = `Attention: It is time for your medication. ${medication.name}, dosage ${medication.dosage}. ${medication.instructions}. This pill looks like a ${medication.pillAppearance}. When you have swallowed this pill, please press the large green button that says: Yes, I Took This Pill.`;
    setIsSpeakingMed(true);
    speak(ttsText, () => setIsSpeakingMed(false));
  };

  return (
    <div
      className={`
        rounded-3xl p-6 sm:p-10 transition-all shadow-elderly
        ${
          isDueNow
            ? 'bg-amber-50/90 border-4 border-amber-400'
            : 'bg-white border-4 border-slate-200/90'
        }
      `}
    >
      {/* Top Banner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-3.5 h-3.5 rounded-full ${
              isDueNow ? 'bg-amber-500 animate-ping' : 'bg-primary-500'
            }`}
          />
          <span
            className={`
              font-black uppercase tracking-wider
              ${isUltraAccessible ? 'text-xl text-amber-950' : 'text-base sm:text-lg text-amber-900'}
            `}
          >
            {isDueNow ? 'NEXT MEDICATION TO TAKE RIGHT NOW' : 'UPCOMING SCHEDULED MEDICATION'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Instructions Button */}
          <button
            type="button"
            onClick={handleReadMedAloud}
            aria-label="Hear medication instructions aloud"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Volume2 className="w-4 h-4 text-primary-700" />
            <span>{isSpeakingMed ? 'Stop Voice' : 'Hear Instructions'}</span>
          </button>

          <StatusBadge
            status={isDueNow ? 'warning' : 'scheduled'}
            label={isDueNow ? 'Due Now' : 'Scheduled'}
            size={isUltraAccessible ? 'lg' : 'md'}
          />
        </div>
      </div>

      {/* Main Pill Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Pill Details */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-3xl shrink-0 shadow-sm border border-amber-200">
              💊
            </div>
            <div>
              <h2
                className={`
                  font-black text-slate-900 leading-tight
                  ${isUltraAccessible ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-4xl'}
                `}
              >
                {medication.name}
              </h2>
              <p
                className={`
                  font-extrabold text-primary-800 mt-1
                  ${isUltraAccessible ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}
                `}
              >
                Dosage: {medication.dosage}
              </p>
            </div>
          </div>

          {/* High-Contrast Instructions Callout */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border-2 border-slate-200 text-slate-800 space-y-2 shadow-sm">
            <p
              className={`
                font-bold text-slate-900
                ${isUltraAccessible ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}
              `}
            >
              How to take: <span className="text-primary-900">{medication.instructions}</span>
            </p>
            <p
              className={`
                text-slate-600 font-medium
                ${isUltraAccessible ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}
              `}
            >
              Looks like: <strong>{medication.pillAppearance}</strong>
            </p>
            <div className="flex items-center gap-3 pt-1 text-xs sm:text-sm font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" /> Scheduled: {medication.scheduledTime}
              </span>
              <span>•</span>
              <span>{medication.mealRelation}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Giant Senior Touch Targets */}
        <div className="lg:col-span-5 flex flex-col gap-3.5">
          <button
            type="button"
            onClick={() => onConfirmTaken(medication.id)}
            className={`
              w-full inline-flex items-center justify-center gap-3 rounded-2xl font-black text-white
              bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800
              shadow-lg shadow-emerald-600/30 transition-transform active:scale-[0.98]
              focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500
              ${
                isUltraAccessible
                  ? 'py-6 px-6 text-2xl sm:text-3xl min-h-[80px]'
                  : 'py-5 px-6 text-xl sm:text-2xl min-h-[68px]'
              }
            `}
          >
            <CheckCircle2 className="w-8 h-8 shrink-0" />
            <span>YES, I TOOK THIS PILL</span>
          </button>

          <button
            type="button"
            onClick={() => onSnooze(medication.id)}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm sm:text-base font-bold bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Remind Me in 15 Minutes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NextMedicationHero;
