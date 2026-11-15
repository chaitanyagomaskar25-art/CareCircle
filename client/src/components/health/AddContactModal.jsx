import React, { useState } from 'react';
import { Check } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Input from '../common/Input.jsx';
import Button from '../common/Button.jsx';
import { addEmergencyContact } from '../../services/health.service.js';
import { useToast } from '../../context/ToastContext.jsx';

export const AddContactModal = ({ isOpen, onClose, elderlyId, onContactAdded }) => {
  const { success, error: toastError } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Family Member',
    phone: '',
    email: '',
    address: '',
    isPrimary: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await addEmergencyContact(elderlyId, formData);
      success('Emergency Contact Saved', `${formData.name} added to emergency list.`);
      if (onContactAdded) onContactAdded(res);
      onClose();
      setFormData({
        name: '',
        relationship: 'Family Member',
        phone: '',
        email: '',
        address: '',
        isPrimary: false,
      });
    } catch (err) {
      toastError('Failed to save contact', err?.message || 'Unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Emergency Contact" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Full Name"
            placeholder="e.g. Sarah Vance"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Relationship"
            placeholder="e.g. Daughter, Neighbor, Nurse"
            value={formData.relationship}
            onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <Input
            label="Email Address (Optional)"
            type="email"
            placeholder="contact@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <Input
          label="Physical Address / Location"
          placeholder="e.g. 742 Evergreen Terrace, Springfield"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isPrimaryContact"
            checked={formData.isPrimary}
            onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
          />
          <label htmlFor="isPrimaryContact" className="text-xs font-semibold text-slate-800">
            Set as Primary First-Call Emergency Contact
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={Check} isLoading={isSubmitting}>
            Save Contact
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddContactModal;
