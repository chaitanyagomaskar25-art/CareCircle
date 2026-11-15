import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Pill,
  Activity,
  UserCheck,
  Check,
  XCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import StatusBadge from '../components/feedback/StatusBadge.jsx';
import ConfirmDoseModal from '../components/medications/ConfirmDoseModal.jsx';
import SkipDoseModal from '../components/medications/SkipDoseModal.jsx';
import { getTodaySchedule } from '../services/medication.service.js';
import { useToast } from '../context/ToastContext.jsx';

export const ScheduleView = () => {
  const { success, warning } = useToast();
  const [scheduleDoses, setScheduleDoses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals for interaction
  const [confirmingDose, setConfirmingDose] = useState(null);
  const [skippingDose, setSkippingDose] = useState(null);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const data = await getTodaySchedule('user-elderly');
      setScheduleDoses(data || []);
    } catch (err) {
      console.warn('Failed loading today schedule', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  // Static care events combined with dynamic medication doses
  const combinedTimeline = [
    ...scheduleDoses.map((d) => {
      const med = d.medicationId || {};
      const name = med.medicineName || med.name || 'Prescription Medication';
      const dosage = med.dosage || '';
      const instructions = med.instructions || 'Take as prescribed';

      return {
        id: d._id || d.id,
        isDose: true,
        doseObj: d,
        time: d.scheduledTimeStr || '08:00',
        title: `${name} ${dosage}`,
        type: 'medication',
        status: d.status, // 'taken' | 'pending' | 'skipped' | 'missed'
        detail: instructions,
        confirmedAt: d.confirmedAt,
        confirmedBy: d.confirmedBy,
        notes: d.notes,
      };
    }),
    {
      id: 'evt-walk',
      isDose: false,
      time: '10:30',
      title: 'Garden Walking Exercise',
      type: 'activity',
      status: 'completed',
      detail: 'Accompanied by Nurse Marcus for 20 minutes in backyard garden',
    },
    {
      id: 'evt-doc',
      isDose: false,
      time: '15:00',
      title: 'Telehealth Video Check-in with Dr. Robert Chen',
      type: 'doctor',
      status: 'upcoming',
      detail: 'Quarterly review of blood pressure trends and medication tolerance',
    },
  ];

  // Sort timeline chronologically
  combinedTimeline.sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daily Care Schedule</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time chronological timeline of medication doses, nurse check-ins, and doctor appointments
          </p>
        </div>
        <Button
          variant="outline"
          icon={RefreshCw}
          onClick={loadSchedule}
          size="sm"
        >
          Refresh Schedule
        </Button>
      </div>

      {/* Main Schedule Timeline */}
      <Card>
        <div className="relative pl-6 space-y-7 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {combinedTimeline.map((evt) => {
            const isTaken = evt.status === 'taken' || evt.status === 'completed';
            const isSkipped = evt.status === 'skipped';
            const isPending = evt.status === 'pending' || evt.status === 'upcoming';

            return (
              <div key={evt.id} className="relative flex items-start gap-4">
                {/* Status Dot on Line */}
                <span
                  className={`
                    absolute -left-6 top-1.5 w-5 h-5 rounded-full border-4 border-white
                    ${
                      isTaken
                        ? 'bg-emerald-500 ring-2 ring-emerald-200'
                        : isSkipped
                        ? 'bg-amber-500 ring-2 ring-amber-200'
                        : 'bg-primary-500 ring-2 ring-primary-200 animate-pulse'
                    }
                  `}
                />

                {/* Event Card */}
                <div
                  className={`flex-1 p-4 rounded-xl border transition-all ${
                    isTaken
                      ? 'bg-emerald-50/40 border-emerald-200/60'
                      : isSkipped
                      ? 'bg-amber-50/40 border-amber-200/60'
                      : 'bg-white border-slate-200/90 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-primary-800 bg-primary-100/80 px-2.5 py-0.5 rounded-md border border-primary-200/70">
                        {evt.time}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                        {evt.type === 'medication' ? (
                          <Pill className="w-4 h-4 text-primary-700" />
                        ) : evt.type === 'doctor' ? (
                          <UserCheck className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Activity className="w-4 h-4 text-teal-600" />
                        )}
                        {evt.title}
                      </h4>
                    </div>

                    <StatusBadge
                      status={isTaken ? 'success' : isSkipped ? 'warning' : 'scheduled'}
                      label={isTaken ? 'Completed' : isSkipped ? 'Skipped' : 'Due / Pending'}
                      size="sm"
                    />
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{evt.detail}</p>

                  {/* Confirmed info or skip notes */}
                  {evt.confirmedAt && (
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Recorded at {new Date(evt.confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {evt.confirmedBy && ` by ${evt.confirmedBy}`}
                    </div>
                  )}

                  {evt.notes && (
                    <div className="mt-1 text-xs text-slate-600 italic bg-white/70 px-2.5 py-1 rounded border border-slate-200/60">
                      Note: {evt.notes}
                    </div>
                  )}

                  {/* Interactive Dose Actions for Pending Medication Doses */}
                  {evt.isDose && evt.status === 'pending' && (
                    <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-slate-100">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Check}
                        onClick={() => setConfirmingDose(evt.doseObj)}
                      >
                        Confirm Taken
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={XCircle}
                        className="text-amber-700 border-amber-300 hover:bg-amber-50"
                        onClick={() => setSkippingDose(evt.doseObj)}
                      >
                        Skip Dose
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Confirmation and Skip Modals */}
      <ConfirmDoseModal
        isOpen={Boolean(confirmingDose)}
        onClose={() => setConfirmingDose(null)}
        dose={confirmingDose}
        onConfirmed={loadSchedule}
      />

      <SkipDoseModal
        isOpen={Boolean(skippingDose)}
        onClose={() => setSkippingDose(null)}
        dose={skippingDose}
        onUpdated={loadSchedule}
      />
    </div>
  );
};

export default ScheduleView;
