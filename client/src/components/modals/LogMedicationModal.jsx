import React, { useState } from 'react';
import { Pill, Plus, Check } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import Button from '../common/Button.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export const LogMedicationModal = ({ isOpen, onClose, onAddMedication }) => {
  const { success } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    timeSlot: 'Morning',
    scheduledTime: '08:00 AM',
    mealRelation: 'After breakfast',
    pillAppearance: '',
    instructions: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Medication name is required.';
    }
    if (!formData.dosage.trim()) {
      newErrors.dosage = 'Dosage (e.g. 10mg, 500mg) is required.';
    }
    if (!formData.scheduledTime.trim()) {
      newErrors.scheduledTime = 'Scheduled time is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      success(
        'Medication Added Successfully',
        `${formData.name} (${formData.dosage}) added to Grandma Eleanor's active regimen.`
      );
      if (onAddMedication) {
        onAddMedication({
          id: `med-${Date.now()}`,
          ...formData,
          status: 'upcoming',
          iconColor: 'bg-primary-100 text-primary-700',
          remainingPills: 30,
        });
      }
      onClose();
      // Reset form
      setFormData({
        name: '',
        dosage: '',
        timeSlot: 'Morning',
        scheduledTime: '08:00 AM',
        mealRelation: 'After breakfast',
        pillAppearance: '',
        instructions: '',
      });
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Medication Schedule"
      subtitle="Register an active prescription with dosages and reminders for senior care"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            Save Prescription
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Medication Name"
            name="name"
            placeholder="e.g. Lisinopril, Metformin"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            icon={Pill}
          />
          <Input
            label="Dosage / Strength"
            name="dosage"
            placeholder="e.g. 10mg, 500mg, 1 tablet"
            value={formData.dosage}
            onChange={handleChange}
            error={errors.dosage}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Time Slot"
            name="timeSlot"
            value={formData.timeSlot}
            onChange={handleChange}
            options={[
              { value: 'Morning', label: '🌅 Morning (Breakfast)' },
              { value: 'Afternoon', label: '☀️ Afternoon (Lunch)' },
              { value: 'Evening', label: '🌇 Evening (Dinner)' },
              { value: 'Night', label: '🌙 Bedtime (Night)' },
            ]}
            required
          />
          <Input
            label="Scheduled Alarm Time"
            name="scheduledTime"
            placeholder="e.g. 08:00 AM"
            value={formData.scheduledTime}
            onChange={handleChange}
            error={errors.scheduledTime}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Meal Relation"
            name="mealRelation"
            value={formData.mealRelation}
            onChange={handleChange}
            options={[
              { value: 'After breakfast', label: 'After breakfast' },
              { value: 'With meal', label: 'With meal (during food)' },
              { value: 'Before meal', label: 'Before meal (on empty stomach)' },
              { value: 'Before sleep', label: 'Before bedtime' },
            ]}
          />
          <Input
            label="Pill Visual Appearance"
            name="pillAppearance"
            placeholder="e.g. White oval tablet, Pink round pill"
            value={formData.pillAppearance}
            onChange={handleChange}
            helperText="Helps the senior recognize the right pill easily"
          />
        </div>

        <Input
          label="Special Doctor Instructions"
          name="instructions"
          placeholder="e.g. Take with a full 8oz glass of water. Do not crush."
          value={formData.instructions}
          onChange={handleChange}
        />
      </form>
    </Modal>
  );
};

export default LogMedicationModal;
