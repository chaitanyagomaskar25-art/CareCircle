import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Select from '../common/Select.jsx';
import Button from '../common/Button.jsx';
import { skipDose } from '../../services/medication.service.js';
import { useToast } from '../../context/ToastContext.jsx';

export const SkipDoseModal = ({ isOpen, onClose, dose, onUpdated }) => {
  const { warning, error: toastError } = useToast();
  const [reasonCategory, setReasonCategory] = useState('Patient feeling unwell / nausea');
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!dose) return null;

  const medName = dose.medicationId?.medicineName || dose.medicationId?.name || 'Medication';
  const timeStr = dose.scheduledTimeStr || 'Scheduled Time';

  const reasonOptions = [
    { value: 'Patient feeling unwell / nausea', label: 'Patient feeling unwell / nausea' },
    { value: 'Patient declined or refused dose', label: 'Patient declined or refused dose' },
    { value: 'Patient asleep / rest period', label: 'Patient asleep / rest period' },
    { value: 'Doctor / Nurse advised temporary hold', label: 'Doctor / Nurse advised temporary hold' },
    { value: 'Fasting for scheduled lab test / procedure', label: 'Fasting for scheduled lab test / procedure' },
    { value: 'Other reason', label: 'Other clinical or personal reason' },
  ];

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const fullNote = customNote.trim()
        ? `${reasonCategory}: ${customNote.trim()}`
        : reasonCategory;

      const doseId = dose._id || dose.id;
      const updated = await skipDose(doseId, fullNote);
      warning(
        'Dose Marked as Skipped',
        `${medName} (${timeStr}) was recorded as skipped. Care Circle notified.`
      );
      if (onUpdated) onUpdated(updated);
      onClose();
    } catch (err) {
      toastError('Action Failed', err.message || 'Could not record skipped dose.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Skipped Dose"
      subtitle={`Document why ${medName} scheduled at ${timeStr} was omitted`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            Confirm Skip Dose
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong className="block font-semibold">Important Care Notice:</strong>
            Skipping a dose is logged permanently in the senior's medication audit record to ensure safety and doctor visibility.
          </div>
        </div>

        <Select
          label="Reason for Skipping Dose *"
          value={reasonCategory}
          onChange={(e) => setReasonCategory(e.target.value)}
          options={reasonOptions}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Additional Clinical or Caregiver Notes
          </label>
          <textarea
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-colors"
            placeholder="e.g. Grandma had mild stomach discomfort after breakfast; doctor alerted via message."
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
};

export default SkipDoseModal;
