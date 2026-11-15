import React, { useState, useEffect } from 'react';
import {
  Users,
  Pill,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  Bell,
  Heart,
  ChevronRight,
  TrendingUp,
  Filter,
  Check,
  XCircle,
  Eye,
  RefreshCw,
  PlusCircle,
  Video,
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import StatusBadge from '../components/feedback/StatusBadge.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ElderlyCareDetailView from './ElderlyCareDetailView.jsx';
import ConfirmDoseModal from '../components/medications/ConfirmDoseModal.jsx';
import SkipDoseModal from '../components/medications/SkipDoseModal.jsx';
import { getCaregiverDashboardOverview } from '../services/caregiver.service.js';
import { useToast } from '../context/ToastContext.jsx';

export const CaregiverDashboard = ({ onOpenLogModal, onOpenEmergencyModal }) => {
  const { success, warning } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeniorId, setSelectedSeniorId] = useState(null);
  const [residentFilter, setResidentFilter] = useState('all'); // 'all' or elderlyId
  const [doseStatusFilter, setDoseStatusFilter] = useState('all'); // 'all' | 'pending' | 'missed' | 'taken'

  // Modals for quick dose verification
  const [confirmingDose, setConfirmingDose] = useState(null);
  const [skippingDose, setSkippingDose] = useState(null);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await getCaregiverDashboardOverview();
      setData(res);
    } catch (err) {
      console.warn('Failed loading caregiver dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  // If a senior is clicked, render their dedicated detailed care overview page
  if (selectedSeniorId) {
    return (
      <ElderlyCareDetailView
        elderlyId={selectedSeniorId}
        onBack={() => {
          setSelectedSeniorId(null);
          loadOverview();
        }}
      />
    );
  }

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Loading caregiver clinical dashboard...
      </div>
    );
  }

  const {
    assignedResidents,
    metrics,
    todayActionDoses,
    upcomingAppointments,
    recentObservations,
    recentNotifications,
    activityTimeline,
  } = data;

  // Filtered Today's Doses
  const filteredDoses = todayActionDoses.filter((dose) => {
    if (residentFilter !== 'all' && dose.residentId !== residentFilter) return false;
    if (doseStatusFilter !== 'all' && dose.status !== doseStatusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-7 pb-12">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-primary-800 tracking-wider uppercase">
            Clinical Caregiver Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Assigned Seniors & Care Overview
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time compliance tracking, overdue task mitigation, and coordinated care management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadOverview}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={onOpenLogModal}
          >
            Add Prescription
          </Button>
        </div>
      </div>

      {/* 1. Metrics KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Assigned Seniors</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {metrics.totalResidents}
          </span>
          <span className="text-[11px] text-primary-700 font-medium">Authorized only</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Today's Doses</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {metrics.todayTotalDoses}
          </span>
          <span className="text-[11px] text-slate-400">Total scheduled</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Pending Doses</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">
            {metrics.todayPendingDoses}
          </span>
          <span className="text-[11px] text-amber-700 font-medium">Due today</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Overdue / Missed</span>
          <span className={`text-2xl font-black mt-1 block ${metrics.todayMissedDoses > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {metrics.todayMissedDoses}
          </span>
          <span className="text-[11px] text-slate-400">Grace period expired</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">7-Day Adherence</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            {metrics.averageAdherenceRate}%
          </span>
          <span className="text-[11px] text-emerald-800 font-medium">Target &gt;90%</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Appointments</span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">
            {metrics.upcomingAppointmentsCount}
          </span>
          <span className="text-[11px] text-blue-700 font-medium">Next 14 days</span>
        </div>
      </div>

      {/* 2. Overview of Assigned Elderly Individuals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-700" />
              Assigned Elderly Residents
            </h2>
            <p className="text-xs text-slate-500">
              Only displaying individuals who explicitly authorized Care Circle access
            </p>
          </div>
        </div>

        {assignedResidents.length === 0 ? (
          <EmptyState
            title="No assigned elderly individuals"
            description="When an elderly resident invites you to join their Care Circle, their health plan will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedResidents.map((senior) => {
              const seniorId = senior._id || senior.id;

              return (
                <div
                  key={seniorId}
                  onClick={() => setSelectedSeniorId(seniorId)}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-primary-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          senior.profileImage ||
                          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256'
                        }
                        alt={senior.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-primary-600 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-primary-800 transition-colors truncate">
                          {senior.name}
                        </h3>
                        <span className="text-xs font-semibold text-primary-700 capitalize block truncate">
                          {senior.relationshipType}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  {/* Adherence progress bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">7-Day Adherence</span>
                      <span className="font-bold text-slate-900">{senior.adherenceRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          senior.adherenceRate >= 90
                            ? 'bg-emerald-500'
                            : senior.adherenceRate >= 75
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${senior.adherenceRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Dose chips */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200">
                        {senior.todayPending} Due Today
                      </span>
                      {senior.todayMissed > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 font-bold border border-rose-200">
                          {senior.todayMissed} Overdue
                        </span>
                      )}
                    </div>
                    <span className="text-primary-700 font-bold text-xs flex items-center gap-1 group-hover:underline">
                      View Care Plan
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Today's Pending & Missed Doses Schedule Table */}
      <Card
        title="Today's Prescribed Dose Queue"
        subtitle="Operational timeline for administering and verifying medications"
      >
        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Filter by Resident:
            </span>
            <select
              value={residentFilter}
              onChange={(e) => setResidentFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="all">All Assigned Seniors ({assignedResidents.length})</option>
              {assignedResidents.map((r) => (
                <option key={r._id || r.id} value={r._id || r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60 text-xs self-start sm:self-auto">
            {['all', 'pending', 'taken', 'missed'].map((st) => (
              <button
                key={st}
                onClick={() => setDoseStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                  doseStatusFilter === st
                    ? 'bg-white text-primary-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {filteredDoses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No medication doses match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Resident</th>
                  <th className="py-3 px-4">Medication & Dose</th>
                  <th className="py-3 px-4">Scheduled Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDoses.map((dose) => {
                  const isTaken = dose.status === 'taken';
                  const isMissed = dose.status === 'missed';
                  const isPending = dose.status === 'pending';

                  return (
                    <tr key={dose.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {dose.residentName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">
                          {dose.medicineName} {dose.dosage}
                        </span>
                        <span className="text-[11px] text-slate-500">{dose.instructions}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-primary-800">
                        {dose.scheduledTimeStr}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          status={isTaken ? 'success' : isMissed ? 'danger' : 'scheduled'}
                          label={isTaken ? 'Taken' : isMissed ? 'Missed / Overdue' : 'Pending'}
                          size="sm"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="primary"
                              size="sm"
                              icon={Check}
                              onClick={() => setConfirmingDose(dose)}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={XCircle}
                              onClick={() => setSkippingDose(dose)}
                            >
                              Skip
                            </Button>
                          </div>
                        ) : isTaken ? (
                          <span className="text-emerald-700 font-semibold text-[11px]">
                            {dose.confirmedBy ? `Verified by ${dose.confirmedBy}` : 'Administered'}
                          </span>
                        ) : (
                          <span className="text-rose-600 font-semibold text-[11px]">
                            Grace period passed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 4 & 5. Upcoming Appointments and Clinical Observations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card
          title="Upcoming Healthcare Appointments"
          subtitle="Specialist consultations, lab tests, and telehealth visits"
        >
          {upcomingAppointments.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No appointments scheduled in the next 14 days.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 -mx-4 -my-2">
              {upcomingAppointments.map((appt) => (
                <div key={appt._id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
                      {appt.isTelehealth ? <Video className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{appt.doctorName}</h4>
                      <p className="text-xs text-slate-500">
                        {appt.elderlyUserId?.name} • {appt.specialty}
                      </p>
                      <p className="text-xs text-primary-800 font-semibold mt-0.5">
                        {new Date(appt.appointmentDate).toLocaleDateString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        • {appt.timeStr || '10:00 AM'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status="scheduled" label="Upcoming" size="sm" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Health Observations */}
        <Card
          title="Recent Clinical Vitals & Observations"
          subtitle="Blood pressure, blood glucose, and wellness logs"
        >
          {recentObservations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No recent vital sign observations recorded.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 -mx-4 -my-2">
              {recentObservations.map((obs) => (
                <div key={obs._id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{obs.title}</h4>
                        <span className="text-xs font-black text-primary-800">{obs.value}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {obs.elderlyUserId?.name} • Recorded by {obs.recordedBy?.name || 'Staff'}
                      </p>
                      {obs.notes && (
                        <p className="text-xs text-slate-600 italic mt-0.5">"{obs.notes}"</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      obs.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800'
                        : obs.severity === 'attention'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {obs.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 6 & 7. Recent Notifications and Care Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Safety Notifications */}
        <Card
          title="Recent Care Alerts & Reminders"
          subtitle="Automated alerts dispatched to caregiver"
        >
          {recentNotifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No recent alerts recorded.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 -mx-4 -my-2">
              {recentNotifications.map((notif) => (
                <div key={notif._id} className="p-4 flex items-start gap-3">
                  <Bell className="w-5 h-5 text-primary-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">{notif.title}</h5>
                    <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(notif.sentAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Real-time Care Activity Audit Timeline */}
        <Card
          title="Care Activity Audit Trail"
          subtitle="Verifiable timeline of doses confirmed and team updates"
        >
          {activityTimeline.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No recent activity logs.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 -mx-4 -my-2">
              {activityTimeline.map((act) => (
                <div key={act._id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">
                      {act.performedBy?.name || 'Staff Member'}
                    </span>{' '}
                    <span className="text-slate-500">performed</span>{' '}
                    <span className="font-mono font-semibold text-primary-800">
                      {act.action?.replace('_', ' ')}
                    </span>
                    {act.elderlyUserId?.name && (
                      <span className="text-slate-500"> for {act.elderlyUserId.name}</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(act.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modals for direct dose confirmation/skip */}
      <ConfirmDoseModal
        isOpen={Boolean(confirmingDose)}
        onClose={() => setConfirmingDose(null)}
        dose={confirmingDose}
        onConfirmed={loadOverview}
      />

      <SkipDoseModal
        isOpen={Boolean(skippingDose)}
        onClose={() => setSkippingDose(null)}
        dose={skippingDose}
        onUpdated={loadOverview}
      />
    </div>
  );
};

export default CaregiverDashboard;
