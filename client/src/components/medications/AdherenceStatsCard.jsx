import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, AlertTriangle, XCircle, Clock, TrendingUp, Calendar } from 'lucide-react';
import { getAdherenceStats } from '../../services/medication.service.js';

export const AdherenceStatsCard = ({ elderlyUserId = 'user-elderly', onStatsLoaded }) => {
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState({
    daysAnalyzed: 7,
    totalScheduled: 0,
    takenCount: 0,
    skippedCount: 0,
    missedCount: 0,
    pendingCount: 0,
    adherenceRate: 100,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async (selectedDays) => {
    setLoading(true);
    try {
      const data = await getAdherenceStats(elderlyUserId, selectedDays);
      setStats(data);
      if (onStatsLoaded) onStatsLoaded(data);
    } catch (e) {
      console.warn('Failed to load adherence statistics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(days);
  }, [days, elderlyUserId]);

  const getAdherenceBadgeColor = (rate) => {
    if (rate >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (rate >= 75) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
      {/* Header with period toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-700" />
            Medication Adherence Analytics
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compliance tracking across scheduled administration windows
          </p>
        </div>

        {/* Days window selector */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60 self-start sm:self-auto">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                days === d
                  ? 'bg-white text-primary-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Adherence Rate Banner */}
        <div className={`p-4 rounded-xl border flex items-center gap-4 ${getAdherenceBadgeColor(stats.adherenceRate)}`}>
          <div className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center font-black text-2xl shadow-xs shrink-0">
            {stats.adherenceRate}%
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block">Adherence Score</span>
            <p className="text-xs mt-0.5 font-medium opacity-90">
              {stats.adherenceRate >= 90
                ? 'Excellent compliance rate'
                : stats.adherenceRate >= 75
                ? 'Moderate compliance'
                : 'Attention recommended'}
            </p>
          </div>
        </div>

        {/* Taken Count */}
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-600 block">Doses Taken</span>
            <span className="text-xl font-black text-emerald-900">{stats.takenCount}</span>
          </div>
        </div>

        {/* Skipped Count */}
        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-600 block">Doses Skipped</span>
            <span className="text-xl font-black text-amber-900">{stats.skippedCount}</span>
          </div>
        </div>

        {/* Total Scheduled */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-600 block">Total Scheduled</span>
            <span className="text-xl font-black text-slate-900">{stats.totalScheduled}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdherenceStatsCard;
