import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  FileText,
  HelpCircle,
  Edit2,
  XCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import Card from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import StatusBadge from '../feedback/StatusBadge.jsx';

export const AppointmentCard = ({
  appointment,
  canManage = false,
  onViewDetails,
  onViewPrepSummary,
  onEdit,
  onCancel,
}) => {
  const isCancelled = appointment.status === 'cancelled';
  const isPast =
    appointment.status === 'completed' ||
    new Date(appointment.appointmentDate).getTime() < Date.now();

  const formattedDate = new Date(appointment.appointmentDate).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime =
    appointment.timeStr ||
    appointment.appointmentTime ||
    new Date(appointment.appointmentDate).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  const questionCount = appointment.questionsForDoctor?.length || 0;

  return (
    <Card
      className={`p-5 transition-all bg-white border ${
        isCancelled
          ? 'border-slate-200 bg-slate-50/50 opacity-75'
          : 'border-slate-200/80 hover:border-teal-300 shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
              {appointment.type || 'Consultation'}
            </span>
            <StatusBadge status={appointment.status} size="sm" />
          </div>
          <h3 className="text-base font-bold text-slate-900">{appointment.doctorName}</h3>
          <p className="text-xs font-semibold text-teal-800">{appointment.specialty}</p>
        </div>

        {/* Telehealth Pill */}
        {appointment.isTelehealth && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-800 border border-primary-200 text-xs font-semibold self-start">
            <Video className="w-3.5 h-3.5 text-primary-700" />
            <span>Telehealth Visit</span>
          </span>
        )}
      </div>

      {/* Date, Time, Location & Reason */}
      <div className="py-3 space-y-2 text-xs text-slate-600">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 font-medium text-slate-800">
            <Calendar className="w-4 h-4 text-slate-400" />
            <strong>{formattedDate}</strong>
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-800">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{formattedTime}</span>
            {appointment.durationMinutes && (
              <span className="text-slate-400">({appointment.durationMinutes} min)</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="truncate">
            {appointment.hospitalName || appointment.clinicName || 'Clinic'}{' '}
            {appointment.location ? `• ${appointment.location}` : ''}
          </span>
        </div>

        {appointment.reason && (
          <div className="p-2.5 rounded-xl bg-warm-50/70 border border-slate-200/60 text-slate-700">
            <p className="font-semibold text-[11px] text-slate-500 uppercase tracking-wider mb-0.5">
              Consultation Goal / Reason
            </p>
            <p>{appointment.reason}</p>
          </div>
        )}

        {/* Questions count badge */}
        {questionCount > 0 && (
          <div className="flex items-center gap-1.5 text-teal-800 font-semibold text-[11px] bg-teal-50/80 px-2.5 py-1 rounded-lg w-fit border border-teal-100">
            <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
            <span>
              {questionCount} Family Question{questionCount > 1 ? 's' : ''} Prepared
            </span>
          </div>
        )}
      </div>

      {/* Actions Toolbar */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {/* Printable Doctor Preparation Summary Button */}
          <button
            type="button"
            onClick={() => onViewPrepSummary && onViewPrepSummary(appointment)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-sm transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Doctor Prep Summary & PDF</span>
          </button>

          {/* Video Consult Join */}
          {appointment.isTelehealth && appointment.telehealthLink && !isCancelled && (
            <a
              href={appointment.telehealthLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold bg-primary-50 hover:bg-primary-100 text-primary-800 border border-primary-200 transition-colors"
            >
              <Video className="w-3.5 h-3.5 text-primary-700" />
              <span>Join Room</span>
              <ExternalLink className="w-3 h-3 text-primary-500" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onViewDetails && onViewDetails(appointment)}
            className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium transition-colors"
          >
            Details
          </button>

          {canManage && !isCancelled && (
            <>
              <button
                type="button"
                onClick={() => onEdit && onEdit(appointment)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Edit Appointment"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onCancel && onCancel(appointment)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                title="Cancel Appointment"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AppointmentCard;
