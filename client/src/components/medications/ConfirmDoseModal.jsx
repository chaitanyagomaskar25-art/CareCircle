import React, { useState } from 'react';
import { CheckCircle2, Pill, User, Clock, Check } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { confirmDoseTaken } from '../../services/medication.service.js';
import { useToast } from '../../context/ToastContext.jsx';

export const ConfirmDoseModal = ({ isOpen, onClose, dose, onConfirmed }) => {
  const { success, error: toastError } = useToast();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!dose) return null;

  const med = dose.medicationId || {};
  const medName = med.medicineName || med.name || 'Prescription Medication';
  const dosage = med.dosage || '';
  const timeStr = dose.scheduledTimeStr || 'Scheduled Time';

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const doseId = dose._id || dose.id;
      const updated = await confirmDoseTaken(doseId, notes.trim());
      success(
        'Dose Confirmed Taken!',
        `${medName} (${timeStr}) recorded as safely administered.`
      );
      if (onConfirmed) onConfirmed(updated);
      onClose();
      setNotes('');
    } catch (err) {
      toastError('Confirmation Failed', err.message || 'Could not confirm dose.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Dose Taken"
      subtitle={`Verify administration of ${medName} ${dosage} at ${timeStr}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Check}
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            Confirm Administered
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Medication review card */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">{medName}</h4>
            <p className="text-xs font-semibold text-emerald-800">
              Dosage: {dosage || '1 unit'} • Time: {timeStr}
            </p>
            {med.instructions && (
              <p className="text-xs text-slate-600 mt-1 italic">
                "{med.instructions}"
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Administration Notes (Optional)
          </label>
          <input
            type="text"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-colors"
            placeholder="e.g. Swallowed easily with full glass of water and lunch"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDoseModal;
