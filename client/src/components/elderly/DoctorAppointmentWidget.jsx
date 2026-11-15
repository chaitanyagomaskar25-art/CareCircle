import React from 'react';
import { Calendar, Clock, MapPin, Phone, Stethoscope, Video } from 'lucide-react';
import Button from '../common/Button.jsx';
import { speak } from '../../utils/speech.js';

export const DoctorAppointmentWidget = ({
  appointment,
  isUltraAccessible = false,
}) => {
  if (!appointment) return null;

  const handleReadAppointment = () => {
    speak(
      `You have an upcoming medical appointment with ${appointment.doctorName} on ${appointment.date} at ${appointment.time}. The clinic is at ${appointment.clinicName}, ${appointment.address}. Purpose: ${appointment.type}.`
    );
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 sm:p-8 shadow-card space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-secondary-100 text-secondary-800 flex items-center justify-center font-bold">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h2
              className={`
                font-black text-slate-900 tracking-tight
                ${isUltraAccessible ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}
              `}
            >
              Upcoming Doctor Visit
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Next scheduled clinical consultation
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReadAppointment}
          className="text-xs sm:text-sm font-bold text-primary-700 hover:text-primary-800"
        >
          Read Aloud
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-secondary-50/60 border border-secondary-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-secondary-200 text-secondary-900">
              {appointment.specialty}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {appointment.type}
            </span>
          </div>

          <h3
            className={`
              font-extrabold text-slate-900
              ${isUltraAccessible ? 'text-2xl' : 'text-xl'}
            `}
          >
            {appointment.doctorName}
          </h3>

          <div className="space-y-1 text-sm text-slate-600">
            <p className="flex items-center gap-2 font-bold text-slate-800">
              <Calendar className="w-4 h-4 text-secondary-700" />
              <span>{appointment.date} at {appointment.time}</span>
            </p>
            <p className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{appointment.clinicName} • {appointment.address}</span>
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <a
            href={`tel:${appointment.phone}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm sm:text-base bg-secondary-700 hover:bg-secondary-800 text-white shadow-sm transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>Call Doctor's Office</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointmentWidget;
