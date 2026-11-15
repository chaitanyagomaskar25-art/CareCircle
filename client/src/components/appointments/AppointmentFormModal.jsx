import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Save,
  Clock,
  MapPin,
  Video,
  AlertCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import Button from '../common/Button.jsx';
import {
  createAppointment,
  updateAppointment,
} from '../../services/appointment.service.js';
import { useToast } from '../../context/ToastContext.jsx';

export const AppointmentFormModal = ({
  isOpen,
  onClose,
  elderlyId,
  appointmentToEdit = null,
  onSaved,
}) => {
  const { success, error: toastError } = useToast();
  const isEditing = Boolean(appointmentToEdit);

  const [formData, setFormData] = useState({
    doctorName: '',
    specialty: 'Primary Geriatrician',
    hospitalName: '',
    clinicName: '',
    location: '',
    appointmentDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    appointmentTime: '10:00 AM',
    durationMinutes: 45,
    type: 'checkup',
    phone: '',
    isTelehealth: false,
    telehealthLink: '',
    reason: 'Routine Geriatric Consultation',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState('');

  useEffect(() => {
    if (appointmentToEdit) {
      const dateStr = appointmentToEdit.appointmentDate
        ? new Date(appointmentToEdit.appointmentDate).toISOString().split('T')[0]
        : '';
      setFormData({
        doctorName: appointmentToEdit.doctorName || '',
        specialty: appointmentToEdit.specialty || 'General Practice',
        hospitalName: appointmentToEdit.hospitalName || appointmentToEdit.clinicName || '',
        clinicName: appointmentToEdit.clinicName || appointmentToEdit.hospitalName || '',
        location: appointmentToEdit.location || '',
        appointmentDate: dateStr,
        appointmentTime: appointmentToEdit.appointmentTime || appointmentToEdit.timeStr || '10:00 AM',
        durationMinutes: appointmentToEdit.durationMinutes || 45,
        type: appointmentToEdit.type || 'checkup',
        phone: appointmentToEdit.phone || '',
        isTelehealth: Boolean(appointmentToEdit.isTelehealth),
        telehealthLink: appointmentToEdit.telehealthLink || '',
        reason: appointmentToEdit.reason || '',
        notes: appointmentToEdit.notes || '',
      });
    } else {
      setFormData({
        doctorName: '',
        specialty: 'Primary Geriatrician',
        hospitalName: '',
        clinicName: '',
        location: '',
        appointmentDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
        appointmentTime: '10:00 AM',
        durationMinutes: 45,
        type: 'checkup',
        phone: '',
        isTelehealth: false,
        telehealthLink: '',
        reason: 'Routine Geriatric Consultation',
        notes: '',
      });
    }
    setConflictError('');
  }, [appointmentToEdit, isOpen]);

  const specialtyOptions = [
    { value: 'Primary Geriatrician', label: 'Primary Geriatrician' },
    { value: 'Cardiology', label: 'Cardiologist' },
    { value: 'Neurology & Memory Care', label: 'Neurologist / Memory Care' },
    { value: 'Endocrinology', label: 'Endocrinologist (Diabetes)' },
    { value: 'Ophthalmology', label: 'Ophthalmologist (Vision / Cataracts)' },
    { value: 'Orthopedics & Joint Care', label: 'Orthopedic Specialist' },
    { value: 'Physical Therapy', label: 'Physical & Occupational Therapy' },
    { value: 'Dental Care', label: 'Geriatric Dentistry' },
    { value: 'General Practice', label: 'General Practice / Family Medicine' },
  ];

  const typeOptions = [
    { value: 'checkup', label: 'Routine Checkup / Wellness Visit' },
    { value: 'specialist', label: 'Specialist Consultation' },
    { value: 'telehealth', label: 'Telehealth Video Consultation' },
    { value: 'lab_work', label: 'Laboratory / Diagnostic Blood Work' },
    { value: 'therapy', label: 'Physical / Speech Therapy' },
    { value: 'dental', label: 'Dental Examination' },
    { value: 'vision', label: 'Vision / Eye Care' },
    { value: 'other', label: 'Other Medical Consultation' },
  ];

  const durationOptions = [
    { value: 15, label: '15 Minutes (Brief Follow-up)' },
    { value: 30, label: '30 Minutes (Standard Consultation)' },
    { value: 45, label: '45 Minutes (Comprehensive Assessment)' },
    { value: 60, label: '60 Minutes (Full Evaluation / Therapy)' },
    { value: 90, label: '90 Minutes (In-depth Diagnostic)' },
  ];

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setConflictError('');

    if (!formData.doctorName.trim()) {
      setConflictError('Please enter the physician or specialist name.');
      return;
    }
    if (!formData.appointmentDate) {
      setConflictError('Please select the appointment date.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Parse appointmentDate and appointmentTime into full ISO string
      let combinedDate = new Date(formData.appointmentDate);
      if (formData.appointmentTime) {
        // e.g. "10:30 AM" or "14:30"
        const timeParts = formData.appointmentTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (timeParts) {
          let hours = parseInt(timeParts[1], 10);
          const minutes = parseInt(timeParts[2], 10);
          const modifier = timeParts[3];
          if (modifier) {
            if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
            if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
          }
          combinedDate.setHours(hours, minutes, 0, 0);
        }
      }

      const payload = {
        elderlyUserId: elderlyId,
        doctorName: formData.doctorName.trim(),
        specialty: formData.specialty,
        hospitalName: formData.hospitalName.trim() || formData.clinicName.trim(),
        clinicName: formData.hospitalName.trim() || formData.clinicName.trim(),
        location: formData.location.trim(),
        appointmentDate: combinedDate.toISOString(),
        appointmentTime: formData.appointmentTime,
        timeStr: formData.appointmentTime,
        durationMinutes: parseInt(formData.durationMinutes, 10) || 45,
        type: formData.type,
        phone: formData.phone.trim(),
        isTelehealth: formData.isTelehealth,
        telehealthLink: formData.isTelehealth ? formData.telehealthLink.trim() : '',
        reason: formData.reason.trim(),
        notes: formData.notes.trim(),
      };

      if (isEditing) {
        await updateAppointment(appointmentToEdit._id || appointmentToEdit.id, payload);
        success('Appointment Updated', 'The doctor consultation details have been updated.');
      } else {
        await createAppointment(payload);
        success('Appointment Scheduled', 'Doctor consultation successfully added to schedule.');
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setConflictError(err.message || 'Failed to save appointment.');
      toastError(err.message || 'Scheduling failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Doctor Consultation' : 'Schedule Doctor Consultation'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {conflictError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{conflictError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Doctor / Specialist Name *"
            placeholder="e.g. Dr. Emily Watson"
            value={formData.doctorName}
            onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
            required
          />

          <Select
            label="Clinical Specialty"
            options={specialtyOptions}
            value={formData.specialty}
            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Hospital / Clinic Name"
            placeholder="e.g. St. Jude Memory Care Hospital"
            value={formData.hospitalName}
            onChange={(e) =>
              setFormData({
                ...formData,
                hospitalName: e.target.value,
                clinicName: e.target.value,
              })
            }
          />

          <Input
            label="Location / Room / Suite"
            placeholder="e.g. Suite 402, North Medical Wing"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Consultation Date *"
            type="date"
            value={formData.appointmentDate}
            onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
            required
          />

          <Input
            label="Scheduled Time *"
            placeholder="e.g. 10:30 AM"
            value={formData.appointmentTime}
            onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
            required
          />

          <Select
            label="Expected Duration"
            options={durationOptions}
            value={formData.durationMinutes}
            onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Consultation Type"
            options={typeOptions}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />

          <Input
            label="Clinic Phone Contact"
            placeholder="e.g. +1 (555) 432-1000"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <Input
          label="Purpose / Reason for Visit"
          placeholder="e.g. Routine blood pressure check & memory medication titration"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        />

        {/* Telehealth toggle */}
        <div className="p-3 rounded-xl bg-warm-50 border border-slate-200/80 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={formData.isTelehealth}
              onChange={(e) => setFormData({ ...formData, isTelehealth: e.target.checked })}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
            />
            <Video className="w-4 h-4 text-teal-700" />
            <span>Online Telehealth Video Consult</span>
          </label>

          {formData.isTelehealth && (
            <Input
              label="Meeting Link / Telehealth Room URL"
              placeholder="e.g. https://meet.carecircle.test/room-watson"
              value={formData.telehealthLink}
              onChange={(e) => setFormData({ ...formData, telehealthLink: e.target.value })}
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Preparation Notes & Doctor Instructions
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. Fasting from midnight for blood draw. Bring reading glasses and current pill bottles."
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Visit' : 'Schedule Visit'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AppointmentFormModal;
