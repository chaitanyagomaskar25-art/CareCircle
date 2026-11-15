import React, { useState } from 'react';
import { Check } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Input from '../common/Input.jsx';
import Button from '../common/Button.jsx';
import { addAllergy } from '../../services/health.service.js';
import { useToast } from '../../context/ToastContext.jsx';

export const AddAllergyModal = ({ isOpen, onClose, elderlyId, onAllergyAdded }) => {
  const { success, error: toastError } = useToast();
  const [formData, setFormData] = useState({
    allergen: '',
    severity: 'moderate',
    reaction: '',
    source: 'verified_medical',
    verifiedBy: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.allergen.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await addAllergy(elderlyId, formData);
      success('Allergy Record Added', `${formData.allergen} added to allergies.`);
      if (onAllergyAdded) onAllergyAdded(res);
      onClose();
      setFormData({
        allergen: '',
        severity: 'moderate',
        reaction: '',
        source: 'verified_medical',
        verifiedBy: '',
      });
    } catch (err) {
      toastError('Failed to record allergy', err?.message || 'Unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Allergy Record" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Allergen Substance / Drug"
          placeholder="e.g. Penicillin, Sulfa, Tree Nuts, Latex"
          value={formData.allergen}
          onChange={(e) => setFormData({ ...formData, allergen: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Severity Level</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
            >
              <option value="mild">Mild (Localized rash, itching)</option>
              <option value="moderate">Moderate (Hives, gastrointestinal)</option>
              <option value="severe">Severe (Facial swelling, asthma)</option>
              <option value="life-threatening">Life-Threatening (Anaphylaxis)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Record Source</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
            >
              <option value="verified_medical">✓ Verified Medical Record</option>
              <option value="manual">✍ Self / Family Reported</option>
            </select>
          </div>
        </div>

        <Input
          label="Specific Reaction Details"
          placeholder="e.g., Immediate hives and shortness of breath"
          value={formData.reaction}
          onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={Check} isLoading={isSubmitting}>
            Save Allergy
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAllergyModal;
