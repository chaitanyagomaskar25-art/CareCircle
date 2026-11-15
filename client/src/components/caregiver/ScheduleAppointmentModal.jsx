import React, { useState } from 'react';
import { Calendar, Save, Video, UserCheck, Clock } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import Button from '../common/Button.jsx';
import { scheduleAppointment } from '../../services/caregiver.service.js';
import { useToast } from '../../context/ToastContext.jsx';

export const ScheduleAppointmentModal = ({ isOpen, onClose, elderlyId, onAdded }) => {
  const { success, error: toastError } = useToast();
  const [formData, setFormData] = useState({
    doctorName: '',
    specialty: 'Primary Geriatrician',
    clinicName: '',
    location: '',
    appointmentDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    timeStr: '10:00 AM',
    type: 'checkup',
    phone: '',
    isTelehealth: false,
    telehealthLink: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.doctorName.trim()) {
      errs.doctorName = 'Doctor name is required.';
    }
    if (!formData.appointmentDate) {
      errs.appointmentDate = 'Appointment date is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await scheduleAppointment(elderlyId, formData);
      success('Appointment Scheduled', `Appointment with ${formData.doctorName} confirmed.`);
      if (onAdded) onAdded(res);
      onClose();
    } catch (err) {
      toastError('Scheduling Failed', err.message || 'Could not schedule appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Doctor Visit or Telehealth"
      subtitle="Register an in-person or video healthcare appointment for senior care tracking"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Save}
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            Confirm Appointment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Doctor / Specialist Name *"
            placeholder="e.g. Dr. Robert Chen, MD"
            value={formData.doctorName}
            onChange={(e) => setFormData((prev) => ({ ...prev, doctorName: e.target.value }))}
            error={errors.doctorName}
            required
          />
          <Input
            label="Specialty"
            placeholder="e.g. Cardiology, Geriatrics, Ophthalmology"
            value={formData.specialty}
            onChange={(e) => setFormData((prev) => ({ ...prev, specialty: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Clinic / Hospital Center"
            placeholder="e.g. Memorial Health Senior Center"
            value={formData.clinicName}
            onChange={(e) => setFormData((prev) => ({ ...prev, clinicName: e.target.value }))}
          />
          <Input
            label="Contact Phone"
            placeholder="e.g. +1 (555) 890-1234"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            type="date"
            label="Appointment Date *"
            value={formData.appointmentDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, appointmentDate: e.target.value }))}
            error={errors.appointmentDate}
            required
          />
          <Input
            label="Time (e.g. 10:00 AM)"
            value={formData.timeStr}
            onChange={(e) => setFormData((prev) => ({ ...prev, timeStr: e.target.value }))}
          />
          <Select
            label="Visit Type"
            value={formData.type}
            onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
            options={[
              { value: 'checkup', label: 'Quarterly Check-up' },
              { value: 'specialist', label: 'Specialist Consultation' },
              { value: 'telehealth', label: 'Telehealth Video Call' },
              { value: 'lab_work', label: 'Lab Work / Blood Draw' },
              { value: 'therapy', label: 'Physical Therapy' },
              { value: 'dental', label: 'Dental Care' },
              { value: 'vision', label: 'Vision / Eye Exam' },
            ]}
          />
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-primary-700" />
              <span className="text-xs font-bold text-slate-800">Telehealth Video Appointment</span>
            </div>
            <input
              type="checkbox"
              checked={formData.isTelehealth}
              onChange={(e) => setFormData((prev) => ({ ...prev, isTelehealth: e.target.checked }))}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
            />
          </div>
          {formData.isTelehealth && (
            <Input
              label="Video Call Link"
              placeholder="e.g. https://meet.google.com/xyz-abc or Zoom URL"
              value={formData.telehealthLink}
              onChange={(e) => setFormData((prev) => ({ ...prev, telehealthLink: e.target.value }))}
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Visit Purpose & Preparation Notes
          </label>
          <textarea
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-colors"
            placeholder="e.g. Routine blood pressure and blood sugar progress check. Bring recent vitals log."
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>
      </form>
    </Modal>
  );
};

export default ScheduleAppointmentModal;
