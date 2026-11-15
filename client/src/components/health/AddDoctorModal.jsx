import React, { useState } from 'react';
import { Check } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Input from '../common/Input.jsx';
import Button from '../common/Button.jsx';
import { addDoctorInformation } from '../../services/health.service.js';
import { useToast } from '../../context/ToastContext.jsx';

export const AddDoctorModal = ({ isOpen, onClose, elderlyId, onDoctorAdded }) => {
  const { success, error: toastError } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    specialty: 'Geriatric Medicine',
    clinic: '',
    phone: '',
    email: '',
    address: '',
    isPrimaryCare: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await addDoctorInformation(elderlyId, formData);
      success('Doctor Information Saved', `${formData.name} added to care team.`);
      if (onDoctorAdded) onDoctorAdded(res);
      onClose();
      setFormData({
        name: '',
        specialty: 'Geriatric Medicine',
        clinic: '',
        phone: '',
        email: '',
        address: '',
        isPrimaryCare: false,
      });
    } catch (err) {
      toastError('Failed to save doctor', err?.message || 'Unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Doctor Information" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Doctor Name & Credentials"
            placeholder="e.g. Dr. Robert Chen, MD"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Specialty / Practice"
            placeholder="e.g. Cardiology, Primary Care"
            value={formData.specialty}
            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            required
          />
        </div>

        <Input
          label="Clinic / Hospital Facility"
          placeholder="e.g. Memorial Health Senior Center"
          value={formData.clinic}
          onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Office Phone"
            type="tel"
            placeholder="+1 (555) 890-1234"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Email / Portal"
            type="email"
            placeholder="doctor@clinic.org"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <Input
          label="Office Address"
          placeholder="Suite 300, 100 Medical Center Parkway"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isPrimaryDoctor"
            checked={formData.isPrimaryCare}
            onChange={(e) => setFormData({ ...formData, isPrimaryCare: e.target.checked })}
            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
          />
          <label htmlFor="isPrimaryDoctor" className="text-xs font-semibold text-slate-800">
            Set as Primary Care Physician (PCP)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={Check} isLoading={isSubmitting}>
            Save Doctor
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddDoctorModal;
