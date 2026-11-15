import React, { useState, useEffect } from 'react';
import {
  Heart,
  Users,
  Pill,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  Phone,
  ShieldCheck,
  Video,
  Filter,
  RefreshCw,
  FileText,
  UserCheck,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Plus,
  Info,
  Check,
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import StatusBadge from '../components/feedback/StatusBadge.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import {
  getFamilyDashboardOverview,
  getFamilyActivityFeed,
} from '../services/family.service.js';
import { useToast } from '../context/ToastContext.jsx';
import AddObservationModal from '../components/caregiver/AddObservationModal.jsx';
import ScheduleAppointmentModal from '../components/caregiver/ScheduleAppointmentModal.jsx';

export const FamilyDashboard = ({ onOpenEmergencyModal }) => {
  const { info, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedSeniorId, setSelectedSeniorId] = useState('all');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'feed' | 'appointments' | 'vitals' | 'contacts'

  // Activity Feed Filter states
  const [feedCategory, setFeedCategory] = useState('all');
  const [feedDateRange, setFeedDateRange] = useState('7days');
  const [feedItems, setFeedItems] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);

  // Permission-aware modal toggles (only opened if user is granted management permissions)
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [activeModalSeniorId, setActiveModalSeniorId] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await getFamilyDashboardOverview();
      setData(res);
      setFeedItems(res.activityFeed || []);
    } catch (err) {
      console.error('Error loading family dashboard:', err);
      toastError('Failed to load family dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredFeed = async (cat, range, seniorId) => {
    try {
      setFeedLoading(true);
      const items = await getFamilyActivityFeed({
        category: cat,
        dateRange: range,
        elderlyUserId: seniorId === 'all' ? '' : seniorId,
      });
      setFeedItems(items);
    } catch (err) {
      console.error('Error loading filtered feed:', err);
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCategoryChange = (cat) => {
    setFeedCategory(cat);
    loadFilteredFeed(cat, feedDateRange, selectedSeniorId);
  };

  const handleDateRangeChange = (range) => {
    setFeedDateRange(range);
    loadFilteredFeed(feedCategory, range, selectedSeniorId);
  };

  const handleSeniorChange = (seniorId) => {
    setSelectedSeniorId(seniorId);
    loadFilteredFeed(feedCategory, feedDateRange, seniorId);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-8 h-8 text-primary-700 animate-spin" />
        <p className="text-sm font-medium text-slate-500">
          Gathering care updates and daily wellness records...
        </p>
      </div>
    );
  }

  const residents = data?.authorizedResidents || [];
  const activeSenior =
    selectedSeniorId === 'all'
      ? residents[0] || null
      : residents.find((r) => (r.id || r._id) === selectedSeniorId) || residents[0];

  const missedDoseAlerts = data?.missedDoseAlerts || [];
  const metrics = data?.metrics || {
    totalSupportedSeniors: residents.length,
    todayAdherenceRate: 100,
    overall7DayAdherence: 100,
    totalPendingDosesToday: 0,
    totalMissedDosesToday: 0,
    upcomingAppointmentsCount: 0,
  };

  // Check if current user has management permissions for active senior
  const hasManageMedications = Boolean(activeSenior?.permissions?.manageMedications);
  const hasManageAppointments = Boolean(activeSenior?.permissions?.manageAppointments);
  const hasAddObservations = Boolean(activeSenior?.permissions?.addHealthObservations);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Senior Selector */}
      <div className="bg-gradient-to-r from-teal-900 via-primary-900 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-teal-950/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-200 text-xs font-semibold backdrop-blur-md">
              <Heart className="w-3.5 h-3.5 text-teal-300" />
              <span>Family Circle Support Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Peace of Mind for Your Loved Ones
            </h1>
            <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed">
              Stay gently connected with daily medication confirmation, clinical caregiver
              observations, and scheduled doctor appointments without intrusion.
            </p>
          </div>

          {/* Quick Actions & Senior Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {residents.length > 1 && (
              <select
                value={selectedSeniorId}
                onChange={(e) => handleSeniorChange(e.target.value)}
                className="bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-300"
              >
                <option value="all" className="text-slate-900">
                  All Loved Ones ({residents.length})
                </option>
                {residents.map((r) => (
                  <option key={r.id || r._id} value={r.id || r._id} className="text-slate-900">
                    {r.name} ({r.relationshipType || 'Family'})
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="outline"
              size="md"
              onClick={onOpenEmergencyModal}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-semibold inline-flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-rose-300" />
              <span>Emergency Help</span>
            </Button>
          </div>
        </div>

        {/* Permission-Aware Status Pill */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-teal-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-300" />
            <span>
              Authorized Relationship:{' '}
              <strong className="text-white">
                {activeSenior ? activeSenior.relationshipType?.toUpperCase() : 'FAMILY MEMBER'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                hasManageMedications || hasManageAppointments || hasAddObservations
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                  : 'bg-white/10 text-teal-100 border border-white/20'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              {hasManageMedications || hasManageAppointments || hasAddObservations
                ? 'Active Family Caregiver Access (Can Record & Schedule)'
                : 'Family View-Only Mode (Read-Only Transparency)'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4 bg-white border-slate-200/80 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              7-Day Adherence
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {metrics.overall7DayAdherence}%
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                High Consistency
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 bg-white border-slate-200/80 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Doses
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {activeSenior?.todayDoses?.taken || 0} / {activeSenior?.todayDoses?.total || 0}
              </span>
              <span className="text-xs text-slate-500">
                ({activeSenior?.todayDoses?.pending || 0} pending)
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 bg-white border-slate-200/80 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Upcoming Visits
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {metrics.upcomingAppointmentsCount}
              </span>
              <span className="text-xs text-slate-500">next 30 days</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 bg-white border-slate-200/80 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Supported Loved Ones
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {residents.length}
              </span>
              <span className="text-xs text-slate-500">connected</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Missed-Dose Reassurance Alert (Visible only when missed doses exist) */}
      {missedDoseAlerts.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-900">
                Care Notice: Unconfirmed Scheduled Dose
              </h3>
              <p className="text-xs text-amber-800/90 leading-relaxed">
                A scheduled medication was not confirmed within the grace window. Please rest
                assured that our automated safety engine has notified the assigned on-duty
                caregiver to verify in person.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-amber-200/60">
            {missedDoseAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white/90 rounded-xl p-3 border border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-700">
                    {alert.residentAvatar ? (
                      <img
                        src={alert.residentAvatar}
                        alt={alert.residentName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      alert.residentName.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {alert.residentName} – {alert.medicineName}{' '}
                      {alert.dosage ? `(${alert.dosage})` : ''}
                    </p>
                    <p className="text-slate-500">
                      Scheduled: {alert.scheduledTimeStr} • Protocol: Caregiver alerted
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Caregiver Dispatched</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 font-semibold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Daily Overview
        </button>
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-4 py-2.5 font-semibold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'feed'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Family Activity Feed
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2.5 font-semibold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'appointments'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Medical Appointments
        </button>
        <button
          onClick={() => setActiveTab('vitals')}
          className={`px-4 py-2.5 font-semibold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'vitals'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Health & Vitals Logs
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-2.5 font-semibold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'contacts'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Care Contacts Directory
        </button>
      </div>

      {/* TAB 1: DAILY OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Authorized Seniors & Today's Doses */}
          <div className="lg:col-span-2 space-y-6">
            {/* Senior Profile Cards */}
            {residents.map((senior) => (
              <Card
                key={senior.id || senior._id}
                className="p-6 bg-white border-slate-200/80 shadow-sm space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        senior.profileImage ||
                        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256'
                      }
                      alt={senior.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-teal-600/30"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">{senior.name}</h2>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                          {senior.relationshipType || 'Loved One'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {senior.phone || 'Contact via Care Coordinator'}
                      </p>
                    </div>
                  </div>

                  {/* Direct Contact Phone Action */}
                  {senior.phone && (
                    <a
                      href={`tel:${senior.phone}`}
                      className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-teal-700" />
                      <span>Direct Call</span>
                    </a>
                  )}
                </div>

                {/* Today's Medication Timeline */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Today's Medication Schedule
                    </h3>
                    <span className="text-xs font-medium text-slate-500">
                      {senior.todayDoses?.taken || 0} of {senior.todayDoses?.total || 0} doses taken
                    </span>
                  </div>

                  {senior.todayDoses?.items?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {senior.todayDoses.items.map((dose) => (
                        <div
                          key={dose._id}
                          className={`p-3 rounded-xl border transition-all ${
                            dose.status === 'taken'
                              ? 'bg-teal-50/60 border-teal-200'
                              : dose.status === 'missed'
                              ? 'bg-rose-50/60 border-rose-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {dose.medicineName}
                            </span>
                            <StatusBadge status={dose.status} size="sm" />
                          </div>
                          <p className="text-xs text-slate-500">{dose.dosage}</p>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {dose.scheduledTimeStr}
                            </span>
                            {dose.confirmedBy && (
                              <span
                                className="truncate max-w-[100px] text-teal-700 font-semibold"
                                title={`Confirmed by ${dose.confirmedBy}`}
                              >
                                ✓ {dose.confirmedBy.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl">
                      No medication doses scheduled for today.
                    </p>
                  )}
                </div>

                {/* Next Upcoming Appointment Highlight */}
                {senior.upcomingAppointments?.length > 0 && (
                  <div className="bg-sky-50/60 border border-sky-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          Next Visit: {senior.upcomingAppointments[0].doctorName} (
                          {senior.upcomingAppointments[0].specialty})
                        </p>
                        <p className="text-slate-500">
                          {new Date(
                            senior.upcomingAppointments[0].appointmentDate
                          ).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            weekday: 'short',
                          })}{' '}
                          at {senior.upcomingAppointments[0].timeStr} •{' '}
                          {senior.upcomingAppointments[0].clinicName}
                        </p>
                      </div>
                    </div>

                    {senior.upcomingAppointments[0].isTelehealth && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 font-semibold">
                        <Video className="w-3 h-3" />
                        Telehealth Video
                      </span>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Right Column: Mini Activity Feed & Emergency Contacts */}
          <div className="space-y-6">
            {/* Quick Activity Highlights */}
            <Card className="p-5 bg-white border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-700" />
                  Recent Care Highlights
                </h3>
                <button
                  onClick={() => setActiveTab('feed')}
                  className="text-xs text-teal-700 hover:text-teal-900 font-semibold"
                >
                  View All Feed →
                </button>
              </div>

              <div className="space-y-3">
                {feedItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-warm-50/60 border border-slate-200/60 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{item.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-2 text-[11px] text-teal-800 font-medium pt-1">
                      <UserCheck className="w-3 h-3 text-teal-600" />
                      <span>{item.actor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Emergency Contacts Card */}
            <Card className="p-5 bg-white border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-rose-600" />
                  Emergency & Support Contacts
                </h3>
                <button
                  onClick={() => setActiveTab('contacts')}
                  className="text-xs text-teal-700 hover:text-teal-900 font-semibold"
                >
                  Directory →
                </button>
              </div>

              <div className="space-y-2">
                {activeSenior?.emergencyContacts?.slice(0, 3).map((contact, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{contact.name}</p>
                      <p className="text-slate-500 capitalize">{contact.relationship}</p>
                    </div>
                    <a
                      href={`tel:${contact.phone}`}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold transition-colors"
                    >
                      Call
                    </a>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: FAMILY ACTIVITY FEED (FILTERABLE) */}
      {activeTab === 'feed' && (
        <Card className="p-6 bg-white border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Care Circle Activity Stream
              </h2>
              <p className="text-xs text-slate-500">
                Real-time chronological timeline of medication doses, appointments, clinical vitals,
                and caregiver observations.
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <select
                value={feedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="all">All Events</option>
                <option value="medications">Medications Only</option>
                <option value="appointments">Medical Appointments</option>
                <option value="observations">Health Vitals</option>
                <option value="notes">Caregiver Notes</option>
              </select>

              {/* Date Range Filter */}
              <select
                value={feedDateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  loadFilteredFeed(feedCategory, feedDateRange, selectedSeniorId)
                }
                className="text-slate-600"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${feedLoading ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          </div>

          {/* Activity Feed Items List */}
          {feedLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-slate-500 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin text-teal-700" />
              <span>Updating activity feed...</span>
            </div>
          ) : feedItems.length > 0 ? (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {feedItems.map((item) => {
                // Determine icon & styling based on event type
                let icon = <CheckCircle2 className="w-4 h-4 text-teal-600" />;
                let iconBg = 'bg-teal-50 border-teal-200';

                if (item.type === 'medication_missed') {
                  icon = <AlertTriangle className="w-4 h-4 text-amber-600" />;
                  iconBg = 'bg-amber-50 border-amber-200';
                } else if (item.category === 'appointments') {
                  icon = <Calendar className="w-4 h-4 text-sky-600" />;
                  iconBg = 'bg-sky-50 border-sky-200';
                } else if (item.category === 'observations') {
                  icon = <Activity className="w-4 h-4 text-rose-600" />;
                  iconBg = 'bg-rose-50 border-rose-200';
                } else if (item.category === 'notes') {
                  icon = <FileText className="w-4 h-4 text-indigo-600" />;
                  iconBg = 'bg-indigo-50 border-indigo-200';
                }

                return (
                  <div key={item.id} className="relative group">
                    {/* Timeline bullet */}
                    <div
                      className={`absolute -left-6 top-1.5 w-6 h-6 rounded-full border flex items-center justify-center ${iconBg} shadow-sm`}
                    >
                      {icon}
                    </div>

                    <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-4 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                          {item.residentName && (
                            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                              {item.residentName}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(item.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {item.description}
                      </p>

                      {item.notes && (
                        <p className="text-xs text-slate-500 italic mt-1 bg-white p-2 rounded-lg border border-slate-200/60">
                          "{item.notes}"
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/50 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                          <span>Logged by {item.actor}</span>
                          <span className="text-slate-400">({item.actorRole})</span>
                        </div>

                        {item.isTelehealth && item.telehealthLink && (
                          <a
                            href={item.telehealthLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Telehealth Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No events in this period"
              description="No care activities matched the selected category and date range."
            />
          )}
        </Card>
      )}

      {/* TAB 3: UPCOMING MEDICAL APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <Card className="p-6 bg-white border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Medical & Specialist Appointments
              </h2>
              <p className="text-xs text-slate-500">
                Coordinated doctor consultations, specialist visits, and telehealth check-ins.
              </p>
            </div>

            {/* Permission-aware action button: only shown if manageAppointments is granted! */}
            {hasManageAppointments ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActiveModalSeniorId(activeSenior?.id || activeSenior?._id);
                  setIsAppointmentModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Visit</span>
              </Button>
            ) : (
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                Appointments managed by Nurse Marcus & Clinic
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSenior?.upcomingAppointments?.length > 0 ? (
              activeSenior.upcomingAppointments.map((appt) => (
                <div
                  key={appt._id}
                  className="p-5 rounded-2xl border border-slate-200 bg-warm-50/50 hover:bg-warm-50 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                        {appt.type}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {appt.doctorName}
                      </h3>
                      <p className="text-xs font-medium text-teal-800">{appt.specialty}</p>
                    </div>

                    <StatusBadge status={appt.status} size="sm" />
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <strong>
                        {new Date(appt.appointmentDate).toLocaleDateString([], {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </strong>{' '}
                      at {appt.timeStr}
                    </p>
                    <p className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <span>{appt.clinicName || 'Clinic Location'}</span>
                    </p>
                  </div>

                  {appt.isTelehealth && appt.telehealthLink && (
                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-xs text-primary-700 font-semibold flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5" />
                        Online Video Consult
                      </span>
                      <a
                        href={appt.telehealthLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1"
                      >
                        Join Room
                      </a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2">
                <EmptyState
                  title="No upcoming visits"
                  description="No medical appointments scheduled for the near future."
                />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* TAB 4: HEALTH OBSERVATIONS & VITALS */}
      {activeTab === 'vitals' && (
        <Card className="p-6 bg-white border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Health Observations & Vitals
              </h2>
              <p className="text-xs text-slate-500">
                Clinical observations, vital signs, and geriatric wellness logs recorded by the care
                circle.
              </p>
            </div>

            {/* Permission-aware action button: only shown if addHealthObservations is granted! */}
            {hasAddObservations ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActiveModalSeniorId(activeSenior?.id || activeSenior?._id);
                  setIsObservationModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Record Vitals</span>
              </Button>
            ) : (
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                Clinical vitals recorded by certified nurses
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeSenior?.recentObservations?.length > 0 ? (
              activeSenior.recentObservations.map((obs) => (
                <div
                  key={obs._id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{obs.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        obs.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : obs.severity === 'elevated'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {obs.severity}
                    </span>
                  </div>

                  <div className="text-2xl font-bold text-slate-900 py-1">
                    {obs.value} <span className="text-xs font-normal text-slate-500">{obs.unit}</span>
                  </div>

                  {obs.notes && <p className="text-slate-600 italic">"{obs.notes}"</p>}

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {new Date(obs.recordedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span>By {obs.recordedBy?.name || 'Nurse'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3">
                <EmptyState
                  title="No vitals logged yet"
                  description="Recent vital signs will appear here once recorded by the nursing team."
                />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* TAB 5: CARE CONTACTS DIRECTORY */}
      {activeTab === 'contacts' && (
        <Card className="p-6 bg-white border-slate-200/80 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              Care Circle Contacts & Support Directory
            </h2>
            <p className="text-xs text-slate-500">
              Direct contact coordinates for your loved one's primary caregivers, physicians, and
              immediate family members.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSenior?.emergencyContacts?.map((contact, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 shadow-sm transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                    {contact.relationship}
                  </span>
                  {contact.isPrimary && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-50 text-teal-700">
                      Primary
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{contact.name}</h3>
                  <p className="text-xs text-slate-500 capitalize">{contact.role}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">{contact.phone}</span>
                  <a
                    href={`tel:${contact.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modals for when family member has management permissions */}
      {hasAddObservations && (
        <AddObservationModal
          isOpen={isObservationModalOpen}
          onClose={() => setIsObservationModalOpen(false)}
          elderlyId={activeModalSeniorId}
          onAdded={loadDashboard}
        />
      )}

      {hasManageAppointments && (
        <ScheduleAppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          elderlyId={activeModalSeniorId}
          onAdded={loadDashboard}
        />
      )}
    </div>
  );
};

export default FamilyDashboard;
