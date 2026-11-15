import React, { useState } from 'react';
import { Activity, Plus, Heart, AlertCircle, Save } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import Button from '../common/Button.jsx';
import { recordHealthObservation } from '../../services/caregiver.service.js';
import { useToast } from '../../context/ToastContext.jsx';

export const AddObservationModal = ({ isOpen, onClose, elderlyId, onAdded }) => {
  const { success, error: toastError } = useToast();
  const [formData, setFormData] = useState({
    type: 'blood_pressure',
    title: 'Blood Pressure',
    value: '',
    unit: 'mmHg',
    severity: 'normal',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const typeOptions = [
    { value: 'blood_pressure', label: 'Blood Pressure (mmHg)' },
    { value: 'blood_glucose', label: 'Blood Glucose (mg/dL)' },
    { value: 'heart_rate', label: 'Heart Rate / Pulse (bpm)' },
    { value: 'temperature', label: 'Body Temperature (°F)' },
    { value: 'oxygen_saturation', label: 'Oxygen Saturation SpO2 (%)' },
    { value: 'weight', label: 'Weight (lbs)' },
    { value: 'general_mood', label: 'Mood & Cognitive State' },
    { value: 'other', label: 'Other Clinical Observation' },
  ];

  const handleTypeChange = (e) => {
    const selectedType = e.target.value;
    let defaultUnit = '';
    let defaultTitle = 'Health Observation';

    switch (selectedType) {
      case 'blood_pressure':
        defaultUnit = 'mmHg';
        defaultTitle = 'Blood Pressure';
        break;
      case 'blood_glucose':
        defaultUnit = 'mg/dL';
        defaultTitle = 'Blood Glucose';
        break;
      case 'heart_rate':
        defaultUnit = 'bpm';
        defaultTitle = 'Heart Rate';
        break;
      case 'temperature':
        defaultUnit = '°F';
        defaultTitle = 'Body Temperature';
        break;
      case 'oxygen_saturation':
        defaultUnit = '%';
        defaultTitle = 'Oxygen Saturation';
        break;
      case 'weight':
        defaultUnit = 'lbs';
        defaultTitle = 'Body Weight';
        break;
      default:
        defaultUnit = '';
        defaultTitle = 'Clinical Note';
    }

    setFormData((prev) => ({
      ...prev,
      type: selectedType,
      unit: defaultUnit,
      title: defaultTitle,
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.value.trim()) {
      setErrorMsg('Please enter a measurement value.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await recordHealthObservation(elderlyId, formData);
      success('Vital Sign Recorded', `${formData.title} recorded successfully.`);
      if (onAdded) onAdded(res);
      onClose();
      // Reset
      setFormData({
        type: 'blood_pressure',
        title: 'Blood Pressure',
        value: '',
        unit: 'mmHg',
        severity: 'normal',
        notes: '',
      });
    } catch (err) {
      toastError('Save Failed', err.message || 'Could not record observation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Vital Sign or Observation"
      subtitle="Document clinical measurements and health observations for senior audit record"
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
            Save Vital Sign
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Observation Type *"
          value={formData.type}
          onChange={handleTypeChange}
          options={typeOptions}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Reading Value *"
            placeholder="e.g. 120/80, 98.6, 72"
            value={formData.value}
            onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
            error={errorMsg}
            required
          />
          <Input
            label="Unit"
            placeholder="e.g. mmHg, mg/dL, bpm, °F"
            value={formData.unit}
            onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
          />
        </div>

        <Select
          label="Clinical Severity Evaluation"
          value={formData.severity}
          onChange={(e) => setFormData((prev) => ({ ...prev, severity: e.target.value }))}
          options={[
            { value: 'normal', label: 'Normal / Target Range' },
            { value: 'attention', label: 'Moderate / Monitor Closely' },
            { value: 'critical', label: 'Critical / Physician Alert Required' },
          ]}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Caregiver Notes & Clinical Context
          </label>
          <textarea
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-colors"
            placeholder="e.g. Taken seated after 5 mins of rest. Senior reported feeling alert and well."
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>
      </form>
    </Modal>
  );
};

export default AddObservationModal;
