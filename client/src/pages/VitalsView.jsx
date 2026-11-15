import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Heart,
  Droplets,
  Scale,
  Smile,
  Plus,
  Check,
  Calendar,
  Filter,
  Clock,
  User,
  Phone,
  MapPin,
  Mail,
  FileText,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Trash2,
  Info,
  Flame,
  RefreshCw,
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import StatusBadge from '../components/feedback/StatusBadge.jsx';
import Loader from '../components/feedback/Loader.jsx';
import MetricLineChart from '../components/charts/MetricLineChart.jsx';
import WellnessBarChart from '../components/charts/WellnessBarChart.jsx';
import RecordObservationModal from '../components/health/RecordObservationModal.jsx';
import AddConditionModal from '../components/health/AddConditionModal.jsx';
import AddAllergyModal from '../components/health/AddAllergyModal.jsx';
import AddContactModal from '../components/health/AddContactModal.jsx';
import AddDoctorModal from '../components/health/AddDoctorModal.jsx';
import * as healthService from '../services/health.service.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useViewMode } from '../context/ViewModeContext.jsx';

export const VitalsView = () => {
  const { user } = useAuth();
  const { isElderlyMode } = useViewMode();
  const { success, error: toastError, info } = useToast();

  const elderlyId = 'elderly-1';

  // Navigation Sub-tabs
  const [activeTab, setActiveTab] = useState('vitals'); // 'vitals' | 'trends' | 'conditions' | 'contacts' | 'wellness' | 'history'

  // Loading & Data states
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);
  const [observations, setObservations] = useState([]);
  const [todayWellness, setTodayWellness] = useState(null);

  // Historical Trends filters
  const [trendMetric, setTrendMetric] = useState('blood_pressure');
  const [trendDays, setTrendDays] = useState(30);
  const [trendsData, setTrendsData] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(false);

  // History Tab Filters
  const [historyMetricFilter, setHistoryMetricFilter] = useState('all');
  const [historySourceFilter, setHistorySourceFilter] = useState('all');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);

  // Load complete health data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, obsRes, wellnessRes] = await Promise.all([
        healthService.getHealthProfile(elderlyId),
        healthService.getHistoricalObservations(elderlyId, { limit: 100 }),
        healthService.getTodayWellnessCheckIn(elderlyId),
      ]);

      setHealthData(profileRes);
      setObservations(obsRes.observations || []);
      setTodayWellness(wellnessRes.todayCheckIn);
    } catch (err) {
      console.error('Error loading health profile data', err);
      toastError('Data Load Notice', 'Loaded default offline health records.');
    } finally {
      setLoading(false);
    }
  }, [elderlyId, toastError]);

  // Load trends data
  const loadTrends = useCallback(async () => {
    try {
      setTrendsLoading(true);
      const res = await healthService.getHistoricalTrends(elderlyId, {
        metricType: trendMetric,
        days: trendDays,
      });
      setTrendsData(res);
    } catch (err) {
      console.error('Error loading trends', err);
    } finally {
      setTrendsLoading(false);
    }
  }, [elderlyId, trendMetric, trendDays]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  // Quick Daily Wellness Check-in handler
  const handleQuickWellness = async (feeling) => {
    try {
      const res = await healthService.recordDailyWellnessCheckIn(elderlyId, {
        feeling,
        energyLevel: 'moderate',
        sleepQuality: 'good',
        waterIntakeGlasses: 6,
        authorName: user?.name || 'Resident',
      });
      setTodayWellness(res.checkIn);
      await loadData();
      await loadTrends();
      success(
        'Daily Wellness Recorded! ⭐',
        `Recorded "${feeling}" status. Your care circle has been notified.`
      );
    } catch (err) {
      toastError('Failed to record check-in', err?.message);
    }
  };

  // Delete handlers
  const handleRemoveCondition = async (condId, name) => {
    if (!window.confirm(`Remove ${name} from medical conditions?`)) return;
    try {
      await healthService.removeMedicalCondition(elderlyId, condId);
      success('Condition Removed', `${name} removed.`);
      loadData();
    } catch (err) {
      toastError('Failed to remove condition', err?.message);
    }
  };

  const handleRemoveAllergy = async (allergyId, allergen) => {
    if (!window.confirm(`Remove ${allergen} from allergies?`)) return;
    try {
      await healthService.removeAllergy(elderlyId, allergyId);
      success('Allergy Removed', `${allergen} removed.`);
      loadData();
    } catch (err) {
      toastError('Failed to remove allergy', err?.message);
    }
  };

  if (loading && !healthData) {
    return <Loader size="lg" text="Loading Health Profile & Wellness Records..." />;
  }

  // Latest observations for each metric
  const latestBP = observations.find((o) => o.metricType === 'blood_pressure' || o.type === 'blood_pressure');
  const latestBS = observations.find((o) => o.metricType === 'blood_sugar' || o.metricType === 'blood_glucose' || o.type === 'blood_glucose');
  const latestWT = observations.find((o) => o.metricType === 'weight' || o.type === 'weight');
  const latestHR = observations.find((o) => o.metricType === 'heart_rate' || o.type === 'heart_rate');
  const latestGW = observations.find((o) => o.metricType === 'general_wellness' || o.type === 'general_wellness');

  const profile = healthData?.profile || {};
  const conditions = profile.medicalConditions || [];
  const allergies = profile.allergies || [];
  const emergencyContacts = profile.emergencyContacts || [];
  const doctors = profile.doctorInformation || [];

  // Filter observations for history table
  const filteredHistory = observations.filter((o) => {
    const isMetric =
      historyMetricFilter === 'all' ||
      o.metricType === historyMetricFilter ||
      o.type === historyMetricFilter;
    const isSource =
      historySourceFilter === 'all' || (o.recordSource || 'manual') === historySourceFilter;
    const date = new Date(o.recordedAt);
    const isAfterStart = !historyStartDate || date >= new Date(historyStartDate);
    const isBeforeEnd = !historyEndDate || date <= new Date(historyEndDate);
    return isMetric && isSource && isAfterStart && isBeforeEnd;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Health Profile & Wellness Tracking
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-800 border border-primary-200">
              Active Resident
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Comprehensive biometrics, clinical conditions, allergies, emergency circle, and historical trends
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => {
              loadData();
              loadTrends();
              info('Refreshed', 'Latest health data synchronized.');
            }}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsRecordModalOpen(true)}
          >
            Record Measurement
          </Button>
        </div>
      </div>

      {/* Non-Diagnostic Clinical Notice Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-950 shadow-sm">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold text-amber-900">
            Clinical Safety & Non-Diagnostic Compliance Notice
          </p>
          <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
            Measurements and self-reports recorded here are for informational tracking and care coordination.
            CareCircle does not generate automated clinical diagnoses or treatment recommendations.
            Always consult a licensed physician for evaluation and prescription directives.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 overflow-x-auto">
        {[
          { id: 'vitals', label: 'Vitals & Biometrics', icon: Activity },
          { id: 'trends', label: 'Historical Trends & Charts', icon: Heart },
          { id: 'conditions', label: `Conditions & Allergies (${conditions.length + allergies.length})`, icon: ShieldCheck },
          { id: 'contacts', label: `Care Team & Emergency (${emergencyContacts.length + doctors.length})`, icon: Phone },
          { id: 'wellness', label: 'Daily Wellness Check-in', icon: Smile },
          { id: 'history', label: `Observation Logs (${observations.length})`, icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap
                ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm shadow-slate-200 border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }
              `}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary-700' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VITALS & BIOMETRICS OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'vitals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Blood Pressure Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-800">Blood Pressure</h2>
                    <p className="text-[10px] text-slate-400">Target: &lt; 130/80 mmHg</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    latestBP?.recordSource === 'verified_medical'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {latestBP?.recordSource === 'verified_medical' ? 'Verified' : 'Manual'}
                </span>
              </div>
              <div className="py-4 text-center">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {latestBP?.value || '120/80'}
                </span>
                <span className="text-xs text-slate-400 block mt-1">mmHg</span>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Recorded: {latestBP ? new Date(latestBP.recordedAt).toLocaleDateString() : 'Today'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setTrendMetric('blood_pressure');
                    setActiveTab('trends');
                  }}
                  className="text-primary-700 font-bold hover:underline"
                >
                  View Trends →
                </button>
              </div>
            </div>

            {/* Blood Sugar Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-800">Blood Sugar</h2>
                    <p className="text-[10px] text-slate-400">Fasting: 70 - 130 mg/dL</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    latestBS?.recordSource === 'verified_medical'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {latestBS?.recordSource === 'verified_medical' ? 'Verified' : 'Manual'}
                </span>
              </div>
              <div className="py-4 text-center">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {latestBS?.value || '104'}
                </span>
                <span className="text-xs text-slate-400 block mt-1">mg/dL</span>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Recorded: {latestBS ? new Date(latestBS.recordedAt).toLocaleDateString() : 'Today'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setTrendMetric('blood_sugar');
                    setActiveTab('trends');
                  }}
                  className="text-primary-700 font-bold hover:underline"
                >
                  View Trends →
                </button>
              </div>
            </div>

            {/* Weight Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-800">Body Weight</h2>
                    <p className="text-[10px] text-slate-400">Dry Morning Weight</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    latestWT?.recordSource === 'verified_medical'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {latestWT?.recordSource === 'verified_medical' ? 'Verified' : 'Manual'}
                </span>
              </div>
              <div className="py-4 text-center">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {latestWT?.value || '142.2'}
                </span>
                <span className="text-xs text-slate-400 block mt-1">lbs</span>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Recorded: {latestWT ? new Date(latestWT.recordedAt).toLocaleDateString() : 'Today'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setTrendMetric('weight');
                    setActiveTab('trends');
                  }}
                  className="text-primary-700 font-bold hover:underline"
                >
                  View Trends →
                </button>
              </div>
            </div>

            {/* Resting Heart Rate Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-800">Heart Rate</h2>
                    <p className="text-[10px] text-slate-400">Target: 60 - 90 BPM</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    latestHR?.recordSource === 'verified_medical'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {latestHR?.recordSource === 'verified_medical' ? 'Verified' : 'Manual'}
                </span>
              </div>
              <div className="py-4 text-center">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {latestHR?.value || '72'}
                </span>
                <span className="text-xs text-slate-400 block mt-1">BPM</span>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Recorded: {latestHR ? new Date(latestHR.recordedAt).toLocaleDateString() : 'Today'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setTrendMetric('heart_rate');
                    setActiveTab('trends');
                  }}
                  className="text-primary-700 font-bold hover:underline"
                >
                  View Trends →
                </button>
              </div>
            </div>
          </div>

          {/* Quick Manual Record Action Callout */}
          <div className="p-6 bg-gradient-to-r from-primary-700 to-primary-900 rounded-3xl text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="space-y-1 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold text-white">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Authorized Clinical & Caregiver Entry
              </span>
              <h2 className="text-lg font-bold">Manually Record Senior Health Biometrics</h2>
              <p className="text-xs text-primary-100 max-w-xl">
                Authorized family members and caregivers can manually record blood pressure, glucose, weight, pulse, and daily status observations.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRecordModalOpen(true)}
              className="bg-white text-primary-900 hover:bg-primary-50 font-bold shadow-md shrink-0"
            >
              + Record Measurement
            </Button>
          </div>

          {/* Mini Preview of Recent Observations */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Health Observations</h2>
                <p className="text-xs text-slate-500">Latest recordings across all biometrics</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('history')}
                className="text-xs font-bold text-primary-700"
              >
                View Full Log ({observations.length}) →
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {observations.slice(0, 5).map((obs) => {
                const isManual = (obs.recordSource || 'manual') === 'manual';
                return (
                  <div key={obs._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                        {obs.metricType === 'blood_pressure' && <Heart className="w-4 h-4 text-indigo-600" />}
                        {obs.metricType === 'blood_sugar' && <Droplets className="w-4 h-4 text-emerald-600" />}
                        {obs.metricType === 'weight' && <Scale className="w-4 h-4 text-sky-600" />}
                        {obs.metricType === 'heart_rate' && <Activity className="w-4 h-4 text-rose-600" />}
                        {obs.metricType === 'general_wellness' && <Smile className="w-4 h-4 text-amber-600" />}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">
                          {obs.title || obs.metricType?.replace('_', ' ')}
                        </span>
                        <span className="text-slate-500 ml-2">
                          {obs.value} {obs.unit}
                        </span>
                        {obs.notes && <p className="text-[11px] text-slate-400 italic">"{obs.notes}"</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isManual
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isManual ? '✍ Manual' : '✓ Verified'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(obs.recordedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HISTORICAL TRENDS & REUSABLE CHARTS */}
      {/* ========================================================================= */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-6">
            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Biometric Trend Charts & Analysis
                </h2>
                <p className="text-xs text-slate-500">
                  Visual history of actual measurements plotted over time
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Metric Selector */}
                <select
                  value={trendMetric}
                  onChange={(e) => setTrendMetric(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="blood_pressure">Blood Pressure (mmHg)</option>
                  <option value="blood_sugar">Blood Sugar (mg/dL)</option>
                  <option value="weight">Body Weight (lbs)</option>
                  <option value="heart_rate">Heart Rate (BPM)</option>
                </select>

                {/* Days Selector */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                  {[7, 14, 30, 90].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTrendDays(d)}
                      className={`
                        px-2.5 py-1 rounded-lg transition-all
                        ${trendDays === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}
                      `}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Verification of Missing Data Rule Banner */}
            <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4 text-emerald-600" />
                True Measurement Guarantee: No missing measurements are artificially invented or guessed.
              </span>
              <span className="text-[11px] text-slate-500">
                {trendsData?.totalReadingsCount || 0} genuine readings recorded in period
              </span>
            </div>

            {/* Statistics Summary Cards */}
            {trendsData?.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Average</span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">
                    {trendsData.bpStats
                      ? `${trendsData.bpStats.averageSystolic}/${trendsData.bpStats.averageDiastolic}`
                      : trendsData.stats.average}
                    <span className="text-xs font-normal text-slate-500 ml-1">
                      {trendsData.stats.unit || ''}
                    </span>
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Minimum</span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">
                    {trendsData.stats.min}
                    <span className="text-xs font-normal text-slate-500 ml-1">
                      {trendsData.stats.unit || ''}
                    </span>
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Maximum</span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">
                    {trendsData.stats.max}
                    <span className="text-xs font-normal text-slate-500 ml-1">
                      {trendsData.stats.unit || ''}
                    </span>
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Verification Split</span>
                  <p className="text-xs font-bold text-slate-900 mt-1.5 flex items-center gap-1.5">
                    <span className="text-emerald-700">{trendsData.verifiedReadingsCount} Verified</span>
                    <span>•</span>
                    <span className="text-amber-700">{trendsData.manualReadingsCount} Manual</span>
                  </p>
                </div>
              </div>
            )}

            {/* Reusable Chart Component */}
            {trendsLoading ? (
              <div className="py-16 flex items-center justify-center">
                <Loader text="Rendering trend charts..." />
              </div>
            ) : (
              <MetricLineChart
                measurements={trendsData?.measurements || []}
                metricType={trendMetric}
                unit={trendsData?.stats?.unit}
                height={260}
              />
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MEDICAL CONDITIONS & ALLERGIES */}
      {/* ========================================================================= */}
      {activeTab === 'conditions' && (
        <div className="space-y-6">
          {/* Medical Conditions Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Medical Conditions</h2>
                <p className="text-xs text-slate-500">Documented medical history and diagnoses</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => setIsConditionModalOpen(true)}
              >
                Add Condition
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conditions.map((c) => {
                const isVerified = c.source === 'verified_medical';
                return (
                  <div
                    key={c._id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-all space-y-2 relative group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                        <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isVerified
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isVerified ? '✓ Verified Medical' : '✍ Manually Noted'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCondition(c._id, c.name)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                          title="Delete condition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      {c.diagnosedDate && (
                        <p>
                          Diagnosed: <span className="text-slate-800 font-medium">{c.diagnosedDate}</span>
                        </p>
                      )}
                      {c.verifiedBy && (
                        <p>
                          Physician: <span className="text-slate-800 font-medium">{c.verifiedBy}</span>
                        </p>
                      )}
                      {c.notes && <p className="italic text-slate-600">"{c.notes}"</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Allergies Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Allergies & Contraindications</h2>
                  <p className="text-xs text-slate-500">Critical allergen alerts and reactions</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => setIsAllergyModalOpen(true)}
              >
                Add Allergy
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allergies.map((a) => {
                const isVerified = a.source === 'verified_medical';
                const isSevere = a.severity === 'severe' || a.severity === 'life-threatening';
                return (
                  <div
                    key={a._id}
                    className={`
                      p-4 rounded-2xl border transition-all space-y-2 relative group
                      ${
                        isSevere
                          ? 'border-rose-200 bg-rose-50/30'
                          : 'border-slate-200/80 bg-slate-50/50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${isSevere ? 'bg-rose-600' : 'bg-amber-500'}`}
                        />
                        <h3 className="text-sm font-bold text-slate-900">{a.allergen}</h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isSevere
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {a.severity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAllergy(a._id, a.allergen)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                          title="Delete allergy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      {a.reaction && (
                        <p>
                          Reaction: <span className="font-semibold text-slate-800">{a.reaction}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        Classification: {isVerified ? '✓ Verified Medical Record' : '✍ Family Reported'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CARE TEAM & EMERGENCY CONTACTS */}
      {/* ========================================================================= */}
      {activeTab === 'contacts' && (
        <div className="space-y-6">
          {/* Emergency Contacts */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Emergency Contacts</h2>
                <p className="text-xs text-slate-500">First-response contacts in case of crisis or alert</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => setIsContactModalOpen(true)}
              >
                Add Emergency Contact
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {emergencyContacts.map((ec) => (
                <div
                  key={ec._id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{ec.name}</h3>
                      <p className="text-xs text-slate-500">{ec.relationship}</p>
                    </div>
                    {ec.isPrimary && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        Primary Contact
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <a
                      href={`tel:${ec.phone}`}
                      className="flex items-center gap-2 text-primary-700 font-bold hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{ec.phone}</span>
                    </a>
                    {ec.email && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{ec.email}</span>
                      </div>
                    )}
                    {ec.address && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{ec.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Information */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Doctor & Medical Provider Directory</h2>
                <p className="text-xs text-slate-500">Attending physicians and healthcare specialists</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => setIsDoctorModalOpen(true)}
              >
                Add Doctor
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {doctors.map((doc) => (
                <div
                  key={doc._id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                      <p className="text-xs text-primary-800 font-medium">{doc.specialty}</p>
                    </div>
                    {doc.isPrimaryCare && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-800 border border-primary-200">
                        PCP
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                    {doc.clinic && <p className="font-semibold text-slate-800">{doc.clinic}</p>}
                    {doc.phone && (
                      <a
                        href={`tel:${doc.phone}`}
                        className="flex items-center gap-2 text-primary-700 font-bold hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{doc.phone}</span>
                      </a>
                    )}
                    {doc.address && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{doc.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DAILY WELLNESS CHECK-IN */}
      {/* ========================================================================= */}
      {activeTab === 'wellness' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interactive Check-in Card */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Smile className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      Daily Wellness Check-in
                    </h2>
                    <p className="text-xs text-slate-500">
                      Record overall well-being, mood, energy, and comfort
                    </p>
                  </div>
                </div>

                {todayWellness?.streak && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                    <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                    <span>{todayWellness.streak}-Day Streak</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  How is the resident feeling today?
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'great', label: 'Great', emoji: '😊', color: 'hover:border-emerald-500 hover:bg-emerald-50' },
                    { id: 'good', label: 'Good', emoji: '🙂', color: 'hover:border-primary-500 hover:bg-primary-50' },
                    { id: 'okay', label: 'Okay', emoji: '😐', color: 'hover:border-amber-500 hover:bg-amber-50' },
                    { id: 'not-well', label: 'Not Well', emoji: '😟', color: 'hover:border-rose-500 hover:bg-rose-50' },
                  ].map((f) => {
                    const isSelected = todayWellness?.feeling === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleQuickWellness(f.id)}
                        className={`
                          p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 text-center
                          ${
                            isSelected
                              ? 'border-primary-700 bg-primary-50/80 ring-2 ring-primary-600/30 font-bold'
                              : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                          }
                          ${f.color}
                        `}
                      >
                        <span className="text-3xl">{f.emoji}</span>
                        <span className="text-sm font-bold text-slate-900">{f.label}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-primary-700">✓ Logged</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status details if already checked in */}
              {todayWellness && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-700 font-semibold">
                    <span>Today's Status Confirmation</span>
                    <span className="text-[11px] text-slate-500">
                      Recorded: {new Date(todayWellness.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Energy Level: <strong>{todayWellness.energyLevel}</strong> • Sleep: <strong>{todayWellness.sleepQuality}</strong>
                  </p>
                  {todayWellness.notes && (
                    <p className="italic text-slate-500 pt-1 border-t border-slate-200">
                      "{todayWellness.notes}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Check-in History Bar Chart */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-4">
              <h3 className="text-sm font-bold text-slate-900">7-Day Wellness History</h3>
              <p className="text-xs text-slate-500">Recorded mood & wellness trend</p>
              <WellnessBarChart
                checkIns={observations.filter(
                  (o) => o.metricType === 'general_wellness' || o.type === 'general_wellness'
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: OBSERVATION LOGS (HISTORICAL RECORDS) */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Historical Health Observations</h2>
              <p className="text-xs text-slate-500">
                Detailed audit trail with date filters and source classification
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsRecordModalOpen(true)}
            >
              Record New Reading
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Metric Type
              </label>
              <select
                value={historyMetricFilter}
                onChange={(e) => setHistoryMetricFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
              >
                <option value="all">All Metrics</option>
                <option value="blood_pressure">Blood Pressure</option>
                <option value="blood_sugar">Blood Sugar</option>
                <option value="weight">Body Weight</option>
                <option value="heart_rate">Heart Rate</option>
                <option value="general_wellness">Wellness Status</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Record Source
              </label>
              <select
                value={historySourceFilter}
                onChange={(e) => setHistorySourceFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
              >
                <option value="all">All Sources</option>
                <option value="manual">✍ Manually Recorded Only</option>
                <option value="verified_medical">✓ Verified Medical Only</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
              />
            </div>
          </div>

          {/* Observations Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Metric</th>
                  <th className="py-3 px-3">Value</th>
                  <th className="py-3 px-3">Verification Source</th>
                  <th className="py-3 px-3">Recorded By</th>
                  <th className="py-3 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No health observations matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((obs) => {
                    const isManual = (obs.recordSource || 'manual') === 'manual';
                    return (
                      <tr key={obs._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">
                          {new Date(obs.recordedAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                          {obs.title || obs.metricType?.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {obs.value} {obs.unit}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isManual
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isManual ? '✍ Manually Recorded' : '✓ Verified Medical'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {obs.recordedBy?.name || 'Caregiver'}
                        </td>
                        <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                          {obs.notes || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <RecordObservationModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        elderlyId={elderlyId}
        onObservationAdded={() => {
          loadData();
          loadTrends();
        }}
      />

      <AddConditionModal
        isOpen={isConditionModalOpen}
        onClose={() => setIsConditionModalOpen(false)}
        elderlyId={elderlyId}
        onConditionAdded={() => loadData()}
      />

      <AddAllergyModal
        isOpen={isAllergyModalOpen}
        onClose={() => setIsAllergyModalOpen(false)}
        elderlyId={elderlyId}
        onAllergyAdded={() => loadData()}
      />

      <AddContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        elderlyId={elderlyId}
        onContactAdded={() => loadData()}
      />

      <AddDoctorModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        elderlyId={elderlyId}
        onDoctorAdded={() => loadData()}
      />
    </div>
  );
};

export default VitalsView;
