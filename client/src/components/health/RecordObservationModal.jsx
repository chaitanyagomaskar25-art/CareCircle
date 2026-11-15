import React, { useState } from 'react';
import { Activity, Heart, Droplets, Scale, Smile, AlertCircle, Check, Info } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import Button from '../common/Button.jsx';
import { recordObservation } from '../../services/health.service.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const RecordObservationModal = ({ isOpen, onClose, elderlyId, onObservationAdded }) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [metricType, setMetricType] = useState('blood_pressure');
  // Blood Pressure specific
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  // General numeric / string values
  const [singleValue, setSingleValue] = useState('');
  const [wellnessStatus, setWellnessStatus] = useState('good');
  const [unit, setUnit] = useState('mmHg');
  const [recordedAt, setRecordedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [recordSource, setRecordSource] = useState('manual');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleMetricChange = (newType) => {
    setMetricType(newType);
    setValidationError('');
    switch (newType) {
      case 'blood_pressure':
        setUnit('mmHg');
        break;
      case 'blood_sugar':
        setUnit('mg/dL');
        if (!singleValue) setSingleValue('100');
        break;
      case 'weight':
        setUnit('lbs');
        if (!singleValue) setSingleValue('140');
        break;
      case 'heart_rate':
        setUnit('bpm');
        if (!singleValue) setSingleValue('72');
        break;
      case 'general_wellness':
        setUnit('status');
        break;
      default:
        setUnit('');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setValidationError('');

    let finalValue = '';
    let parsedSystolic = null;
    let parsedDiastolic = null;
    let numericValue = null;

    if (metricType === 'blood_pressure') {
      const s = parseInt(systolic, 10);
      const d = parseInt(diastolic, 10);
      if (isNaN(s) || isNaN(d) || s <= 0 || d <= 0) {
        setValidationError('Please enter valid positive systolic and diastolic values.');
        return;
      }
      finalValue = `${s}/${d}`;
      parsedSystolic = s;
      parsedDiastolic = d;
      numericValue = s;
    } else if (metricType === 'general_wellness') {
      finalValue = wellnessStatus;
    } else {
      if (!singleValue.trim()) {
        setValidationError('Please enter a measurement value.');
        return;
      }
      const num = parseFloat(singleValue);
      if (isNaN(num)) {
        setValidationError('Please enter a valid numeric measurement.');
        return;
      }
      finalValue = String(singleValue).trim();
      numericValue = num;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        elderlyUserId: elderlyId || 'elderly-1',
        metricType,
        value: finalValue,
        unit,
        recordedAt: new Date(recordedAt).toISOString(),
        recordedBy: user?._id || 'caregiver-1',
        authorName: user?.name || 'Caregiver',
        authorRole: user?.role || 'caregiver',
        notes: notes.trim(),
        recordSource,
        systolic: parsedSystolic,
        diastolic: parsedDiastolic,
        numericValue,
      };

      const result = await recordObservation(elderlyId || 'elderly-1', payload);
      success(
        'Measurement Recorded',
        `Manually recorded ${metricType.replace('_', ' ')} (${finalValue} ${unit}) successfully.`
      );
      if (onObservationAdded) onObservationAdded(result.observation || payload);
      onClose();

      // Reset
      setNotes('');
      setSingleValue('');
    } catch (err) {
      toastError('Failed to Record Measurement', err?.message || 'Unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manually Record Health Observation"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Metric Type Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Metric to Record
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'blood_pressure', label: 'Blood Pressure', icon: Heart, unit: 'mmHg' },
              { id: 'blood_sugar', label: 'Blood Sugar', icon: Droplets, unit: 'mg/dL' },
              { id: 'weight', label: 'Weight', icon: Scale, unit: 'lbs' },
              { id: 'heart_rate', label: 'Heart Rate', icon: Activity, unit: 'bpm' },
              { id: 'general_wellness', label: 'Wellness Status', icon: Smile, unit: 'status' },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = metricType === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleMetricChange(m.id)}
                  className={`
                    p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all text-xs font-semibold
                    ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50 text-primary-900 ring-2 ring-primary-500/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-primary-700' : 'text-slate-400'}`} />
                  <span className="truncate">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Inputs according to selected metric */}
        {metricType === 'blood_pressure' ? (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              Blood Pressure Reading (mmHg)
            </span>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Systolic (Top Number)"
                type="number"
                placeholder="120"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                required
              />
              <Input
                label="Diastolic (Bottom Number)"
                type="number"
                placeholder="80"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                required
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Target range for seniors is typically evaluated by primary physician.
            </p>
          </div>
        ) : metricType === 'general_wellness' ? (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <label className="text-xs font-bold text-slate-800 block">
              General Wellness & Mood Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'great', label: 'Great', emoji: '😊' },
                { id: 'good', label: 'Good', emoji: '🙂' },
                { id: 'okay', label: 'Okay', emoji: '😐' },
                { id: 'not-well', label: 'Not Well', emoji: '😟' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setWellnessStatus(s.id)}
                  className={`
                    p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all
                    ${
                      wellnessStatus === s.id
                        ? 'border-primary-600 bg-white ring-2 ring-primary-500/30 text-primary-900 font-bold'
                        : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-white'
                    }
                  `}
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-xs">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-3 gap-3 items-end">
              <div className="col-span-2">
                <Input
                  label={`Measurement Value (${unit})`}
                  type="number"
                  step="any"
                  placeholder={
                    metricType === 'blood_sugar'
                      ? '105'
                      : metricType === 'weight'
                      ? '142.5'
                      : '72'
                  }
                  value={singleValue}
                  onChange={(e) => setSingleValue(e.target.value)}
                  required
                />
              </div>
              <div>
                <Input
                  label="Unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Date / Time & Source Identification */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Recorded Date & Time"
            type="datetime-local"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Record Verification Classification
            </label>
            <select
              value={recordSource}
              onChange={(e) => setRecordSource(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="manual">✍ Manually Recorded (Caregiver / Home Monitor)</option>
              <option value="verified_medical">✓ Verified Medical Record (Clinic / Doctor)</option>
            </select>
          </div>
        </div>

        {/* Clinical / Observation Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Optional Notes / Context
          </label>
          <textarea
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Taken seated before breakfast; resident reported feeling well"
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Medical Disclaimer Banner */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p>
            <strong>Informational Tracking Only:</strong> CareCircle does not automatically diagnose conditions or provide treatment recommendations. All manual entries are preserved as non-diagnostic observations.
          </p>
        </div>

        {validationError && (
          <div className="flex items-center gap-2 text-rose-600 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={Check} isLoading={isSubmitting}>
            Save Observation
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordObservationModal;
