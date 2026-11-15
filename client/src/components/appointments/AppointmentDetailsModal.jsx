import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  FileText,
  HelpCircle,
  Plus,
  Send,
  Phone,
  ExternalLink,
  UserCheck,
} from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import StatusBadge from '../feedback/StatusBadge.jsx';
import { addQuestionToAppointment } from '../../services/appointment.service.js';
import { useToast } from '../../context/ToastContext.jsx';

export const AppointmentDetailsModal = ({
  isOpen,
  onClose,
  appointment,
  canManage = false,
  onViewPrepSummary,
  onUpdated,
}) => {
  const { success, error: toastError } = useToast();
  const [newQuestion, setNewQuestion] = useState('');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleAddQuestion = async (e) => {
    if (e) e.preventDefault();
    if (!newQuestion.trim()) return;

    try {
      setIsAddingQuestion(true);
      const updated = await addQuestionToAppointment(
        appointment._id || appointment.id,
        newQuestion.trim()
      );
      success('Question Added', 'Your question has been included in the doctor consultation notes.');
      setNewQuestion('');
      if (onUpdated) onUpdated(updated);
    } catch (err) {
      toastError(err.message || 'Failed to add question');
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const formattedDate = new Date(appointment.appointmentDate).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
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

  const questions = appointment.questionsForDoctor || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Appointment Details & Family Notes"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 text-xs text-slate-700">
        {/* Header Block */}
        <div className="p-4 rounded-2xl bg-warm-50 border border-slate-200/80 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                {appointment.type || 'Medical Visit'}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {appointment.doctorName}
              </h2>
              <p className="text-xs font-semibold text-teal-800">{appointment.specialty}</p>
            </div>
            <StatusBadge status={appointment.status} size="sm" />
          </div>

          <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                <strong>{formattedDate}</strong> at {formattedTime}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>
                {appointment.hospitalName || appointment.clinicName || 'Clinic'}{' '}
                {appointment.location ? `• ${appointment.location}` : ''}
              </span>
            </div>
          </div>

          {appointment.phone && (
            <div className="flex items-center gap-2 text-slate-500 pt-1">
              <Phone className="w-3.5 h-3.5" />
              <span>Clinic Contact: {appointment.phone}</span>
            </div>
          )}

          {appointment.isTelehealth && appointment.telehealthLink && (
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-semibold text-primary-800">
                <Video className="w-4 h-4 text-primary-700" />
                Telehealth Online Room Ready
              </span>
              <a
                href={appointment.telehealthLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-lg inline-flex items-center gap-1"
              >
                <span>Launch Video Visit</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Reason & Preparation Notes */}
        <div className="space-y-3">
          {appointment.reason && (
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                Purpose / Reason for Consultation
              </h3>
              <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                {appointment.reason}
              </p>
            </div>
          )}

          {appointment.notes && (
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                Preparation Notes & Instructions
              </h3>
              <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                {appointment.notes}
              </p>
            </div>
          )}
        </div>

        {/* Family Questions for Doctor */}
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-teal-700" />
              Family Questions for Physician ({questions.length})
            </h3>
          </div>

          <form onSubmit={handleAddQuestion} className="flex gap-2">
            <input
              type="text"
              placeholder="Ask a question for the doctor (e.g. Any fatigue side effects?)"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="flex-1 p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none text-xs"
            />
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isAddingQuestion || !newQuestion.trim()}
              className="inline-flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isAddingQuestion ? 'Adding...' : 'Add'}</span>
            </Button>
          </form>

          {questions.length > 0 ? (
            <div className="space-y-2">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-teal-50/60 border border-teal-200 text-xs space-y-1"
                >
                  <p className="font-bold text-slate-900">{q.question}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Added by {q.addedByName || 'Family Member'}</span>
                    <span>
                      {new Date(q.createdAt || Date.now()).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-3 rounded-xl bg-slate-50 text-slate-400 italic text-center">
              No family questions submitted yet. Add one above to include it in the doctor's brief!
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onViewPrepSummary(appointment);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-sm transition-colors text-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Doctor Prep Summary</span>
          </button>

          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AppointmentDetailsModal;
