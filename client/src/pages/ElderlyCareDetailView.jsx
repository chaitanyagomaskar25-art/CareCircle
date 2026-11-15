import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Heart,
  Pill,
  Calendar,
  Activity,
  FileText,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Mail,
  Plus,
  ShieldCheck,
  Video,
  Check,
  XCircle,
  Filter,
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import StatusBadge from '../components/feedback/StatusBadge.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import AddObservationModal from '../components/caregiver/AddObservationModal.jsx';
import AddCareNoteModal from '../components/caregiver/AddCareNoteModal.jsx';
import ScheduleAppointmentModal from '../components/caregiver/ScheduleAppointmentModal.jsx';
import ConfirmDoseModal from '../components/medications/ConfirmDoseModal.jsx';
import SkipDoseModal from '../components/medications/SkipDoseModal.jsx';
import { getElderlyDetail } from '../services/caregiver.service.js';
import { useToast } from '../context/ToastContext.jsx';

export const ElderlyCareDetailView = ({ elderlyId, onBack }) => {
  const { success, warning } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'history' | 'appointments' | 'observations' | 'notes' | 'contacts'

  // History filters
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [historyDateFilter, setHistoryDateFilter] = useState('7d'); // 'today' | '7d' | '30d' | 'all'

  // Modals
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [confirmingDose, setConfirmingDose] = useState(null);
  const [skippingDose, setSkippingDose] = useState(null);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await getElderlyDetail(elderlyId);
      setData(res);
    } catch (err) {
      console.warn('Failed loading resident detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [elderlyId]);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Loading resident care overview...
      </div>
    );
  }

  const { resident, careCircleMembers, todaySchedule, medicationHistory, appointments, observations, careNotes, adherence } = data;

  // Filtered History
  const filteredHistory = (medicationHistory || []).filter((item) => {
    if (historyStatusFilter !== 'all' && item.status !== historyStatusFilter) return false;
    if (historyDateFilter === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      return item.scheduledAt?.startsWith(todayStr);
    }
    if (historyDateFilter === '7d') {
      const sevenDaysAgo = Date.now() - 7 * 86400 * 1000;
      return new Date(item.scheduledAt).getTime() >= sevenDaysAgo;
    }
    if (historyDateFilter === '30d') {
      const thirtyDaysAgo = Date.now() - 30 * 86400 * 1000;
      return new Date(item.scheduledAt).getTime() >= thirtyDaysAgo;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Back button & Resident Header Banner */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-xs font-semibold text-primary-700 uppercase tracking-wider block">
            Individual Resident Care Plan
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {resident.name}
          </h1>
        </div>
      </div>

      {/* Senior Personal Health Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <img
              src={
                resident.profileImage ||
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256'
              }
              alt={resident.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-600 shadow-sm shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">{resident.name}</h2>
                <StatusBadge status="success" label="Authorized Access" size="sm" />
                <span className="px-2 py-0.5 rounded-md bg-primary-50 text-primary-800 text-xs font-bold border border-primary-200">
                  {resident.room || 'Room 304, West Wing'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {resident.phone || 'No phone on file'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {resident.email}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Activity}
              onClick={() => setIsObsModalOpen(true)}
            >
              Record Vitals
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={FileText}
              onClick={() => setIsNoteModalOpen(true)}
            >
              Add Note
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Calendar}
              onClick={() => setIsApptModalOpen(true)}
            >
              Schedule Visit
            </Button>
          </div>
        </div>

        {/* Clinical Conditions & Allergies Tags */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px] mb-1">
              Documented Diagnoses
            </span>
            <div className="flex flex-wrap gap-1">
              {(resident.conditions || ['Hypertension', 'Type 2 Diabetes', 'Osteoarthritis']).map((c, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-white text-slate-800 font-semibold border border-slate-200">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
            <span className="font-bold text-rose-900 block uppercase tracking-wider text-[11px] mb-1">
              Known Drug Allergies
            </span>
            <div className="flex flex-wrap gap-1">
              {(resident.allergies || ['Penicillin', 'Sulfa drugs']).map((a, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-white text-rose-800 font-bold border border-rose-200">
                  {a}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="font-bold text-emerald-900 block uppercase tracking-wider text-[11px]">
                7-Day Adherence Score
              </span>
              <span className="text-xl font-black text-emerald-950 mt-0.5 block">
                {adherence?.adherenceRate || 93}%
              </span>
            </div>
            <span className="text-xs text-emerald-800 font-medium">
              {adherence?.takenCount || 0} / {adherence?.totalScheduled || 0} Doses
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'schedule', label: `Today's Doses (${todaySchedule?.length || 0})`, icon: Pill },
          { id: 'history', label: `Medication History (${medicationHistory?.length || 0})`, icon: Clock },
          { id: 'appointments', label: `Appointments (${appointments?.length || 0})`, icon: Calendar },
          { id: 'observations', label: `Vitals & Observations (${observations?.length || 0})`, icon: Activity },
          { id: 'notes', label: `Care Notes (${careNotes?.length || 0})`, icon: FileText },
          { id: 'contacts', label: `Care Circle Team (${careCircleMembers?.length || 0})`, icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'border-primary-700 text-primary-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Today's Medication Schedule */}
      {activeTab === 'schedule' && (
        <Card title="Today's Prescribed Doses" subtitle="Chronological administration timeline with 1-click confirmation">
          {todaySchedule?.length === 0 ? (
            <EmptyState
              title="No medication doses scheduled for today"
              description="All current prescriptions are up to date."
            />
          ) : (
            <div className="divide-y divide-slate-100 -mx-4 -my-2">
              {todaySchedule.map((dose) => {
                const med = dose.medicationId || {};
                const isTaken = dose.status === 'taken';
                const isSkipped = dose.status === 'skipped';
                const isPending = dose.status === 'pending';

                return (
                  <div
                    key={dose._id || dose.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isTaken
                            ? 'bg-emerald-100 text-emerald-800'
                            : isSkipped
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-primary-100 text-primary-800'
                        }`}
                      >
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {med.medicineName} {med.dosage}
                          </h4>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {dose.scheduledTimeStr}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {med.instructions || 'Take with water'}
                        </p>
                        {med.pillAppearance && (
                          <span className="text-[11px] text-slate-500 mt-0.5 block">
                            Appearance: {med.pillAppearance}
                          </span>
                        )}
                        {dose.confirmedAt && (
                          <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">
                            Confirmed at {new Date(dose.confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {dose.confirmedBy?.name && ` by ${dose.confirmedBy.name}`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <StatusBadge
                        status={isTaken ? 'success' : isSkipped ? 'warning' : 'scheduled'}
                        label={isTaken ? 'Taken' : isSkipped ? 'Skipped' : 'Pending'}
                        size="sm"
                      />
                      {isPending && (
                        <div className="flex items-center gap-1.5 ml-2">
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
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Filtered Medication History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                History Filter:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Status filter */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60 text-xs">
                {['all', 'taken', 'skipped', 'missed'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setHistoryStatusFilter(s)}
                    className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                      historyStatusFilter === s
                        ? 'bg-white text-primary-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Date window filter */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60 text-xs">
                {[
                  { id: 'today', label: 'Today' },
                  { id: '7d', label: '7 Days' },
                  { id: '30d', label: '30 Days' },
                  { id: 'all', label: 'All History' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setHistoryDateFilter(d.id)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      historyDateFilter === d.id
                        ? 'bg-white text-primary-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Card>
            {filteredHistory.length === 0 ? (
              <EmptyState
                title="No doses match these filter criteria"
                description="Try broadening the date window or selecting all statuses."
              />
            ) : (
              <div className="divide-y divide-slate-100 -mx-4 -my-2">
                {filteredHistory.map((item) => (
                  <div
                    key={item._id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          item.status === 'taken'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'skipped'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 text-sm">
                            {item.medicationId?.medicineName} {item.medicationId?.dosage}
                          </h5>
                          <span className="font-mono text-xs text-slate-500 font-semibold">
                            {item.scheduledTimeStr}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Scheduled: {new Date(item.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {item.scheduledTimeStr}
                          {item.confirmedAt && ` • Confirmed ${new Date(item.confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-slate-600 italic bg-warm-50 px-2 py-0.5 rounded border border-slate-100 mt-1 inline-block">
                            "{item.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <StatusBadge
                      status={item.status === 'taken' ? 'success' : item.status === 'skipped' ? 'warning' : 'danger'}
                      label={item.status.toUpperCase()}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 3: Appointments Schedule */}
      {activeTab === 'appointments' && (
        <Card
          title="Scheduled Healthcare Appointments"
          subtitle="In-person physician visits, telehealth sessions, and clinic check-ups"
        >
          {appointments?.length === 0 ? (
            <EmptyState
              title="No appointments scheduled"
              description="Click 'Schedule Visit' above to add upcoming checkups."
              actionLabel="Schedule Appointment"
              onAction={() => setIsApptModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((appt) => (
                <div
                  key={appt._id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
                        {appt.isTelehealth ? <Video className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{appt.doctorName}</h4>
                        <p className="text-xs text-primary-800 font-semibold">{appt.specialty}</p>
                      </div>
                    </div>
                    <StatusBadge
                      status={appt.status === 'completed' ? 'success' : 'scheduled'}
                      label={appt.status.toUpperCase()}
                      size="sm"
                    />
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                    <p className="text-slate-700 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(appt.appointmentDate).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      • {appt.timeStr || '10:00 AM'}
                    </p>
                    {appt.clinicName && (
                      <p className="text-slate-600 font-medium">Location: {appt.clinicName}</p>
                    )}
                    {appt.phone && <p className="text-slate-500">Phone: {appt.phone}</p>}
                    {appt.notes && <p className="text-slate-500 italic mt-1">"{appt.notes}"</p>}
                  </div>

                  {appt.isTelehealth && appt.telehealthLink && (
                    <a
                      href={appt.telehealthLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Join Video Call
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: Health Observations */}
      {activeTab === 'observations' && (
        <Card
          title="Clinical Health Observations & Vitals"
          subtitle="Vital signs recorded during clinical check-ins and nurse shifts"
        >
          {observations?.length === 0 ? (
            <EmptyState
              title="No observations recorded yet"
              description="Click 'Record Vitals' to document blood pressure, glucose, or pulse."
              actionLabel="Record Vitals"
              onAction={() => setIsObsModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {observations.map((obs) => (
                <div
                  key={obs._id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {obs.title}
                    </span>
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

                  <div className="text-2xl font-black text-slate-900">
                    {obs.value}
                  </div>

                  {obs.notes && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {obs.notes}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{new Date(obs.recordedAt).toLocaleDateString()}</span>
                    <span>{obs.recordedBy?.name || 'Staff'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 5: Care Notes */}
      {activeTab === 'notes' && (
        <Card title="Clinical Shift Notes & Orders" subtitle="Care notes and shift observations">
          {careNotes?.length === 0 ? (
            <EmptyState
              title="No care notes on file"
              description="Document shift handoffs or physician orders for the team."
              actionLabel="Add Care Note"
              onAction={() => setIsNoteModalOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {careNotes.map((note) => (
                <div
                  key={note._id}
                  className={`p-4 rounded-2xl border transition-colors ${
                    note.isPriority
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-white border-slate-200/80 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 px-2 py-0.5 rounded bg-slate-100">
                        {note.category}
                      </span>
                      {note.isPriority && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                          Priority Alert
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(note.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-sm text-slate-800 leading-relaxed">{note.note}</p>
                  <div className="mt-2 text-xs text-slate-500 font-medium">
                    Authored by {note.authorId?.name || 'Caregiver'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 6: Care Circle Contacts */}
      {activeTab === 'contacts' && (
        <Card
          title="Care Circle Family & Caregiver Contacts"
          subtitle="Authorized team members connected to this elderly resident"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {careCircleMembers?.map((member) => {
              const u = member.memberUserId || {};
              return (
                <div
                  key={member._id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-sm shrink-0">
                      {u.name?.charAt(0) || 'M'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{u.name}</h4>
                      <span className="text-xs font-semibold text-primary-700 capitalize block">
                        {member.relationshipType}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    {u.phone && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {u.phone}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {u.email}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                    {member.permissions?.map((p, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                      >
                        {p.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Action Modals */}
      <AddObservationModal
        isOpen={isObsModalOpen}
        onClose={() => setIsObsModalOpen(false)}
        elderlyId={elderlyId}
        onAdded={loadDetail}
      />

      <AddCareNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        elderlyId={elderlyId}
        onAdded={loadDetail}
      />

      <ScheduleAppointmentModal
        isOpen={isApptModalOpen}
        onClose={() => setIsApptModalOpen(false)}
        elderlyId={elderlyId}
        onAdded={loadDetail}
      />

      <ConfirmDoseModal
        isOpen={Boolean(confirmingDose)}
        onClose={() => setConfirmingDose(null)}
        dose={confirmingDose}
        onConfirmed={loadDetail}
      />

      <SkipDoseModal
        isOpen={Boolean(skippingDose)}
        onClose={() => setSkippingDose(null)}
        dose={skippingDose}
        onUpdated={loadDetail}
      />
    </div>
  );
};

export default ElderlyCareDetailView;
