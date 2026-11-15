import React, { useState } from 'react';
import { FileText, Save, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Select from '../common/Select.jsx';
import Button from '../common/Button.jsx';
import { recordCareNote } from '../../services/caregiver.service.js';
import { useToast } from '../../context/ToastContext.jsx';

export const AddCareNoteModal = ({ isOpen, onClose, elderlyId, onAdded }) => {
  const { success, error: toastError } = useToast();
  const [formData, setFormData] = useState({
    category: 'general',
    note: '',
    isPriority: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.note.trim()) {
      setErrorMsg('Please enter care note text.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await recordCareNote(elderlyId, formData);
      success('Care Note Recorded', 'Clinical care note saved.');
      if (onAdded) onAdded(res);
      onClose();
      setFormData({ category: 'general', note: '', isPriority: false });
    } catch (err) {
      toastError('Save Failed', err.message || 'Could not record care note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Clinical Care Note"
      subtitle="Document shift observations, dietary notes, or doctor instructions"
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
            Save Note
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Note Category"
          value={formData.category}
          onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
          options={[
            { value: 'general', label: 'General Daily Wellbeing' },
            { value: 'medical', label: 'Medical & Medication Tolerance' },
            { value: 'dietary', label: 'Dietary & Hydration Intake' },
            { value: 'behavioral', label: 'Cognitive & Behavioral Note' },
            { value: 'physician_instruction', label: "Physician's Direct Orders" },
          ]}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Care Note Observations *
          </label>
          <textarea
            rows={4}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-colors ${
              errorMsg ? 'border-rose-400' : 'border-slate-200/90'
            }`}
            placeholder="e.g. Senior ate full breakfast, took morning Lisinopril tablet smoothly. Expressed cheerful mood and walked in the garden."
            value={formData.note}
            onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
          />
          {errorMsg && <p className="mt-1 text-xs text-rose-500">{errorMsg}</p>}
        </div>

        <div className="p-3 bg-warm-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 block">Flag as High Priority</span>
            <span className="text-[11px] text-slate-500">
              Pin this note to the top of the resident's shift handoff log
            </span>
          </div>
          <input
            type="checkbox"
            checked={formData.isPriority}
            onChange={(e) => setFormData((prev) => ({ ...prev, isPriority: e.target.checked }))}
            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
          />
        </div>
      </form>
    </Modal>
  );
};

export default AddCareNoteModal;
