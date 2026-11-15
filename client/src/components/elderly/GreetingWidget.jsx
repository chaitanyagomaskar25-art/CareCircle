import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Clock, Sun, Sunset, Moon } from 'lucide-react';
import { speak, stopSpeech } from '../../utils/speech.js';

export const GreetingWidget = ({
  name = 'Grandma Eleanor',
  avatar,
  room = 'Apt 4B - Oakridge Senior Residence',
  isUltraAccessible = false,
  onToggleUltraAccessible,
}) => {
  const [time, setTime] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timePeriod, setTimePeriod] = useState('Afternoon');
  const [isSpeakingState, setIsSpeakingState] = useState(false);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      );

      const hour = now.getHours();
      if (hour < 12) setTimePeriod('Morning');
      else if (hour < 17) setTimePeriod('Afternoon');
      else setTimePeriod('Evening');
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleReadAloud = () => {
    if (isSpeakingState) {
      stopSpeech();
      setIsSpeakingState(false);
      return;
    }

    const greetingText = `Good ${timePeriod}, ${name}. Today is ${dateStr}. The time is ${time}. You are at ${room}. Everything is running smoothly in your Care Circle today.`;
    setIsSpeakingState(true);
    speak(greetingText, () => setIsSpeakingState(false));
  };

  const periodIcons = {
    Morning: Sun,
    Afternoon: Sun,
    Evening: Sunset,
  };

  const PeriodIcon = periodIcons[timePeriod] || Sun;

  return (
    <div
      className={`
        rounded-3xl p-6 sm:p-10 text-white shadow-xl transition-all
        ${
          isUltraAccessible
            ? 'bg-primary-950 border-4 border-primary-500'
            : 'bg-gradient-to-r from-primary-800 via-primary-900 to-slate-900 border-2 border-primary-700/60'
        }
      `}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* User Greeting & Date */}
        <div className="flex items-center gap-5 sm:gap-6">
          {avatar && (
            <div className="relative shrink-0">
              <img
                src={avatar}
                alt={name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-200 animate-pulse" />
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary-200 font-semibold text-base sm:text-lg">
              <PeriodIcon className="w-5 h-5 text-amber-300" />
              <span>Good {timePeriod},</span>
            </div>

            <h1
              className={`
                font-black tracking-tight text-white
                ${isUltraAccessible ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-4xl'}
              `}
            >
              {name} 🌸
            </h1>

            <p className="text-primary-100 font-medium text-sm sm:text-base pt-0.5">
              {dateStr}
            </p>

            <p className="text-xs text-primary-300 font-medium hidden sm:block">
              {room}
            </p>
          </div>
        </div>

        {/* Large Digital Clock & Speech Actions */}
        <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
          <div className="text-left sm:text-right">
            <span className="text-[11px] font-bold text-primary-200 uppercase tracking-widest block">
              CURRENT TIME
            </span>
            <span
              className={`
                font-black text-white font-mono tracking-tight block
                ${isUltraAccessible ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'}
              `}
            >
              {time || '12:30 PM'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Text-To-Speech Audio Reader Button */}
            <button
              type="button"
              onClick={handleReadAloud}
              aria-label={isSpeakingState ? 'Stop audio' : 'Listen to daily greeting'}
              className={`
                inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm
                ${
                  isSpeakingState
                    ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-300/40 animate-pulse'
                    : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                }
              `}
            >
              {isSpeakingState ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-300" />}
              <span>{isSpeakingState ? 'Stop Reading' : 'Hear Briefing'}</span>
            </button>

            {/* Accessibility Toggle */}
            <button
              type="button"
              onClick={onToggleUltraAccessible}
              className={`
                px-3 py-2 rounded-xl text-xs font-bold transition-all
                ${
                  isUltraAccessible
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }
              `}
            >
              {isUltraAccessible ? 'Standard Text' : 'Extra Large Text'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GreetingWidget;
