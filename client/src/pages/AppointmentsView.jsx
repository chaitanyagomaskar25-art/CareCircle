import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  History,
  FileText,
  Filter,
  RefreshCw,
  AlertCircle,
  Video,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import CalendarView from '../components/appointments/CalendarView.jsx';
import AppointmentCard from '../components/appointments/AppointmentCard.jsx';
import AppointmentFormModal from '../components/appointments/AppointmentFormModal.jsx';
import AppointmentDetailsModal from '../components/appointments/AppointmentDetailsModal.jsx';
import PreparationSummaryModal from '../components/appointments/PreparationSummaryModal.jsx';
import {
  getAppointments,
  cancelAppointment,
} from '../services/appointment.service.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export const AppointmentsView = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'calendar' | 'past'
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState(null);
  const [selectedDetailsAppt, setSelectedDetailsAppt] = useState(null);
  const [selectedPrepSummaryAppt, setSelectedPrepSummaryAppt] = useState(null);

  // Can the current user manage appointments?
  const canManage = user?.role === 'caregiver' || user?.role === 'admin' || user?.role === 'elderly';

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await getAppointments({ status: 'all' });
      setAppointments(data || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      toastError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleEdit = (appt) => {
    setAppointmentToEdit(appt);
    setIsFormModalOpen(true);
  };

  const handleCancel = async (appt) => {
    const confirmReason = window.prompt(
      `Are you sure you want to cancel the visit with ${appt.doctorName}? Please enter an optional cancellation reason:`
    );
    if (confirmReason === null) return; // cancelled prompt

    try {
      await cancelAppointment(appt._id || appt.id, confirmReason);
      success('Appointment Cancelled', 'The scheduled consultation has been cancelled.');
      loadAppointments();
    } catch (err) {
      toastError(err.message || 'Failed to cancel appointment');
    }
  };

  const upcomingAppointments = appointments
    .filter(
      (a) =>
        a.status !== 'cancelled' &&
        a.status !== 'completed' &&
        new Date(a.appointmentDate).getTime() >= Date.now() - 3600 * 1000
    )
    .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

  const pastAppointments = appointments
    .filter(
      (a) =>
        a.status === 'completed' ||
        a.status === 'cancelled' ||
        new Date(a.appointmentDate).getTime() < Date.now() - 3600 * 1000
    )
    .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

  // Calendar filter: appointments matching the selected calendar date
  const selectedDateKey = selectedDate.toISOString().split('T')[0];
  const calendarDayAppointments = appointments.filter((a) => {
    if (!a.appointmentDate) return false;
    return new Date(a.appointmentDate).toISOString().split('T')[0] === selectedDateKey;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Doctor Consultations & Appointments
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              {upcomingAppointments.length} Upcoming
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Coordinate physician visits, telehealth sessions, and generate printable doctor
            preparation summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadAppointments}
            className="text-slate-600 hover:text-slate-900"
            title="Refresh appointments"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {canManage && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setAppointmentToEdit(null);
                setIsFormModalOpen(true);
              }}
              className="inline-flex items-center gap-2 shadow-sm bg-teal-700 hover:bg-teal-800"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Appointment</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Navigation Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-sm">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 font-semibold rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Upcoming Appointments ({upcomingAppointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 font-semibold rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'calendar'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Interactive Calendar View</span>
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 font-semibold rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'past'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Visit History ({pastAppointments.length})</span>
        </button>
      </div>

      {/* 3. Tab Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <RefreshCw className="w-8 h-8 text-teal-700 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading consultations schedule...</p>
        </div>
      ) : activeTab === 'upcoming' ? (
        /* TAB 1: UPCOMING LIST */
        upcomingAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingAppointments.map((appt) => (
              <AppointmentCard
                key={appt._id || appt.id}
                appointment={appt}
                canManage={canManage}
                onViewDetails={(a) => setSelectedDetailsAppt(a)}
                onViewPrepSummary={(a) => setSelectedPrepSummaryAppt(a)}
                onEdit={handleEdit}
                onCancel={handleCancel}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No upcoming doctor visits"
            description="All upcoming medical consultations and specialist appointments will appear here."
            actionLabel={canManage ? 'Schedule First Appointment' : undefined}
            onAction={
              canManage
                ? () => {
                    setAppointmentToEdit(null);
                    setIsFormModalOpen(true);
                  }
                : undefined
            }
          />
        )
      ) : activeTab === 'calendar' ? (
        /* TAB 2: INTERACTIVE CALENDAR VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CalendarView
              appointments={appointments}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
            />
          </div>

          <div className="space-y-4">
            <Card className="p-5 bg-white border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedDate.toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </h3>
                <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {calendarDayAppointments.length} Visit{calendarDayAppointments.length !== 1 ? 's' : ''}
                </span>
              </div>

              {calendarDayAppointments.length > 0 ? (
                <div className="space-y-3">
                  {calendarDayAppointments.map((appt) => (
                    <div
                      key={appt._id || appt.id}
                      className="p-3 rounded-xl bg-warm-50/70 border border-slate-200 text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{appt.doctorName}</p>
                          <p className="text-slate-500">{appt.specialty}</p>
                        </div>
                        <span className="font-bold text-teal-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                          {appt.timeStr || appt.appointmentTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50">
                        <button
                          type="button"
                          onClick={() => setSelectedPrepSummaryAppt(appt)}
                          className="text-xs font-bold text-teal-700 hover:text-teal-900"
                        >
                          Prep Summary & PDF →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No appointments scheduled for this date.
                </p>
              )}

              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAppointmentToEdit(null);
                    setIsFormModalOpen(true);
                  }}
                  className="w-full text-xs font-semibold justify-center"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Book for this Date</span>
                </Button>
              )}
            </Card>
          </div>
        </div>
      ) : (
        /* TAB 3: PAST APPOINTMENTS HISTORY */
        pastAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastAppointments.map((appt) => (
              <AppointmentCard
                key={appt._id || appt.id}
                appointment={appt}
                canManage={false}
                onViewDetails={(a) => setSelectedDetailsAppt(a)}
                onViewPrepSummary={(a) => setSelectedPrepSummaryAppt(a)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No past appointments"
            description="Completed and historical appointments will be archived here."
          />
        )
      )}

      {/* Modals */}
      <AppointmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setAppointmentToEdit(null);
        }}
        elderlyId={user?.role === 'elderly' ? user._id : undefined}
        appointmentToEdit={appointmentToEdit}
        onSaved={loadAppointments}
      />

      <AppointmentDetailsModal
        isOpen={Boolean(selectedDetailsAppt)}
        onClose={() => setSelectedDetailsAppt(null)}
        appointment={selectedDetailsAppt}
        canManage={canManage}
        onViewPrepSummary={(appt) => {
          setSelectedDetailsAppt(null);
          setSelectedPrepSummaryAppt(appt);
        }}
        onUpdated={() => {
          loadAppointments();
        }}
      />

      <PreparationSummaryModal
        isOpen={Boolean(selectedPrepSummaryAppt)}
        onClose={() => setSelectedPrepSummaryAppt(null)}
        appointmentId={selectedPrepSummaryAppt?._id || selectedPrepSummaryAppt?.id}
      />
    </div>
  );
};

export default AppointmentsView;
