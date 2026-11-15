import React, { useState, useEffect } from 'react';
import { Pill, Plus, Save, Clock, Calendar, AlertCircle, ShieldAlert, Check } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import Button from '../common/Button.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { createMedication, updateMedication } from '../../services/medication.service.js';

export const MedicationModal = ({ isOpen, onClose, medication = null, onSaved }) => {
  const { success, error: toastError } = useToast();
  const isEditing = Boolean(medication);

  const initialFormState = {
    medicineName: '',
    dosage: '',
    purpose: '',
    instructions: '',
    frequency: 'daily',
    scheduledTimes: ['08:00'],
    pillAppearance: '',
    remainingInventory: 30,
    refillThreshold: 7,
    prescribedBy: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'active',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [scheduledTimeString, setScheduledTimeString] = useState('08:00');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (medication) {
      setFormData({
        medicineName: medication.medicineName || medication.name || '',
        dosage: medication.dosage || '',
        purpose: medication.purpose || medication.description || '',
        instructions: medication.instructions || '',
        frequency: medication.frequency || 'daily',
        scheduledTimes: Array.isArray(medication.scheduledTimes) && medication.scheduledTimes.length > 0
          ? medication.scheduledTimes
          : [medication.scheduledTime || '08:00'],
        pillAppearance: medication.pillAppearance || '',
        remainingInventory: medication.remainingInventory ?? medication.remainingPills ?? 30,
        refillThreshold: medication.refillThreshold ?? 7,
        prescribedBy: medication.prescribedBy || '',
        startDate: medication.startDate ? new Date(medication.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: medication.endDate ? new Date(medication.endDate).toISOString().split('T')[0] : '',
        status: medication.status || 'active',
      });
      setScheduledTimeString(
        Array.isArray(medication.scheduledTimes) && medication.scheduledTimes.length > 0
          ? medication.scheduledTimes.join(', ')
          : medication.scheduledTime || '08:00'
      );
    } else {
      setFormData(initialFormState);
      setScheduledTimeString('08:00');
    }
    setErrors({});
  }, [medication, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.medicineName.trim()) {
      errs.medicineName = 'Medicine name is required.';
    }
    if (!formData.dosage.trim()) {
      errs.dosage = 'Dosage (e.g. 10mg, 500mg) is required.';
    }
    if (!formData.instructions.trim()) {
      errs.instructions = 'Instructions (e.g. Take with water after breakfast) are required.';
    }

    // Parse times
    const times = scheduledTimeString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const invalidTime = times.find((t) => !timeRegex.test(t));
    if (times.length === 0 || invalidTime) {
      errs.scheduledTimes = 'Please enter valid 24-hr times separated by commas (e.g. 08:00, 20:00).';
    }

    if (formData.remainingInventory < 0) {
      errs.remainingInventory = 'Inventory cannot be negative.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTimesChange = (e) => {
    const val = e.target.value;
    setScheduledTimeString(val);
    if (errors.scheduledTimes) {
      setErrors((prev) => ({ ...prev, scheduledTimes: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const times = scheduledTimeString
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        ...formData,
        scheduledTimes: times,
        remainingInventory: Number(formData.remainingInventory) || 0,
        refillThreshold: Number(formData.refillThreshold) || 7,
      };

      let result;
      if (isEditing) {
        const id = medication._id || medication.id;
        result = await updateMedication(id, payload);
        success('Prescription Updated', `${payload.medicineName} regimen updated successfully.`);
      } else {
        result = await createMedication(payload);
        success('Prescription Created', `${payload.medicineName} added to active care plan.`);
      }

      if (onSaved) onSaved(result);
      onClose();
    } catch (err) {
      toastError('Save Failed', err.message || 'Could not save medication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Medication Prescription' : 'Add New Medication'}
      subtitle={
        isEditing
          ? 'Update dosage, schedule times, and refill inventory thresholds'
          : 'Register a prescribed medicine with schedule, pill appearance, and care notes'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={isEditing ? Save : Plus}
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            {isEditing ? 'Save Changes' : 'Add Medication'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Medicine Name *"
            name="medicineName"
            placeholder="e.g. Lisinopril, Metformin"
            value={formData.medicineName}
            onChange={handleChange}
            error={errors.medicineName}
            required
          />
          <Input
            label="Dosage *"
            name="dosage"
            placeholder="e.g. 10mg, 500mg, 1 tablet"
            value={formData.dosage}
            onChange={handleChange}
            error={errors.dosage}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Medical Condition / Purpose"
            name="purpose"
            placeholder="e.g. High Blood Pressure, Diabetes"
            value={formData.purpose}
            onChange={handleChange}
          />
          <Select
            label="Frequency"
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
            options={[
              { value: 'daily', label: 'Once Daily' },
              { value: 'twice_daily', label: 'Twice Daily (Morning & Evening)' },
              { value: 'thrice_daily', label: 'Three Times Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'as_needed', label: 'As Needed (PRN)' },
            ]}
          />
        </div>

        <div>
          <Input
            label="Scheduled Times (24-hr format, comma separated) *"
            name="scheduledTimes"
            placeholder="e.g. 08:00, 19:00"
            value={scheduledTimeString}
            onChange={handleTimesChange}
            error={errors.scheduledTimes}
            helperText="Separate multiple daily dose times with commas (e.g. 08:00, 12:30, 20:00)"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Administration Instructions *
          </label>
          <textarea
            name="instructions"
            rows={2}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-colors ${
              errors.instructions ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200/90'
            }`}
            placeholder="e.g. Take 1 tablet with full glass of water after breakfast. Do not crush."
            value={formData.instructions}
            onChange={handleChange}
          />
          {errors.instructions && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.instructions}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Pill Visual Appearance"
            name="pillAppearance"
            placeholder="e.g. Round pink tablet, scored line"
            value={formData.pillAppearance}
            onChange={handleChange}
            helperText="Crucial for elderly recognition and safety"
          />
          <Input
            label="Prescribing Doctor / Clinic"
            name="prescribedBy"
            placeholder="e.g. Dr. Robert Chen, MD"
            value={formData.prescribedBy}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <Input
            type="number"
            min="0"
            label="Current Pill Count"
            name="remainingInventory"
            value={formData.remainingInventory}
            onChange={handleChange}
            error={errors.remainingInventory}
          />
          <Input
            type="number"
            min="1"
            label="Refill Alert At"
            name="refillThreshold"
            value={formData.refillThreshold}
            onChange={handleChange}
            helperText="Warn when below this count"
          />
          <Select
            label="Prescription Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'paused', label: 'Temporarily Paused' },
              { value: 'discontinued', label: 'Discontinued' },
            ]}
          />
        </div>
      </form>
    </Modal>
  );
};

export default MedicationModal;
