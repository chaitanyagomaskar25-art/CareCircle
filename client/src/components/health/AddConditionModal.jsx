import React, { useState } from 'react';
import { Plus, Check, ShieldCheck } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import Button from '../common/Button.jsx';
import { addMedicalCondition } from '../../services/health.service.js';
import { useToast } from '../../context/ToastContext.jsx';

export const AddConditionModal = ({ isOpen, onClose, elderlyId, onConditionAdded }) => {
  const { success, error: toastError } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    diagnosedDate: '',
    status: 'managed',
    source: 'verified_medical',
    verifiedBy: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await addMedicalCondition(elderlyId, formData);
      success('Medical Condition Saved', `${formData.name} added to health profile.`);
      if (onConditionAdded) onConditionAdded(res);
      onClose();
      setFormData({
        name: '',
        diagnosedDate: '',
        status: 'managed',
        source: 'verified_medical',
        verifiedBy: '',
        notes: '',
      });
    } catch (err) {
      toastError('Failed to add condition', err?.message || 'Unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Medical Condition" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Condition Name"
          placeholder="e.g. Hypertension, Type 2 Diabetes, Glaucoma"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Diagnosis Date (Approximate)"
            type="date"
            value={formData.diagnosedDate}
            onChange={(e) => setFormData({ ...formData, diagnosedDate: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
            >
              <option value="managed">Managed / Under Control</option>
              <option value="active">Active Monitoring</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Record Classification
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
            >
              <option value="verified_medical">✓ Verified Medical Diagnosis</option>
              <option value="manual">✍ Self / Caregiver Reported</option>
            </select>
          </div>

          <Input
            label="Verified By / Diagnosing Physician"
            placeholder="e.g. Dr. Robert Chen, MD"
            value={formData.verifiedBy}
            onChange={(e) => setFormData({ ...formData, verifiedBy: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Management Plan</label>
          <textarea
            rows="2"
            placeholder="e.g., Regulated by low sodium diet and medication."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={Check} isLoading={isSubmitting}>
            Add Condition
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddConditionModal;
