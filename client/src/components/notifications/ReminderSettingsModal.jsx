import React, { useState, useEffect } from 'react';
import { Settings, Save, Clock, ShieldAlert, Bell, Mail, Smartphone, AlertTriangle } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Input from '../common/Input.jsx';
import Button from '../common/Button.jsx';
import {
  getReminderSettings,
  updateReminderSettings,
} from '../../services/notification.service.js';
import { useToast } from '../../context/ToastContext.jsx';

export const ReminderSettingsModal = ({ isOpen, onClose, elderlyId = 'user-elderly' }) => {
  const { success, error: toastError } = useToast();
  const [formData, setFormData] = useState({
    reminderLeadTimeMinutes: 15,
    missedDoseGracePeriodMinutes: 30,
    caregiverNotificationDelayMinutes: 0,
    familyEscalation: {
      enabled: true,
      delayAfterCaregiverMinutes: 30,
    },
    channels: {
      inApp: true,
      email: true,
    },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, elderlyId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getReminderSettings(elderlyId);
      if (data) {
        setFormData({
          reminderLeadTimeMinutes: data.reminderLeadTimeMinutes ?? 15,
          missedDoseGracePeriodMinutes: data.missedDoseGracePeriodMinutes ?? 30,
          caregiverNotificationDelayMinutes: data.caregiverNotificationDelayMinutes ?? 0,
          familyEscalation: {
            enabled: data.familyEscalation?.enabled ?? true,
            delayAfterCaregiverMinutes: data.familyEscalation?.delayAfterCaregiverMinutes ?? 30,
          },
          channels: {
            inApp: data.channels?.inApp ?? true,
            email: data.channels?.email ?? true,
          },
        });
      }
    } catch (err) {
      console.warn('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await updateReminderSettings(elderlyId, formData);
      success('Settings Saved', 'Automated reminder and escalation schedule updated.');
      onClose();
    } catch (err) {
      toastError('Save Failed', err.message || 'Could not update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reminder & Escalation Settings"
      subtitle="Configure automated alert schedules, grace periods, and family safety escalations"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Save}
            isLoading={saving}
            onClick={handleSubmit}
          >
            Save Settings
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        {/* Core Notice */}
        <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200/60 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <p className="text-xs text-teal-900 leading-relaxed">
            CareCircle calculates schedule alerts in UTC and accurately adjusts to the resident's timezone. Notifications never claim a dose was missed until the defined grace period has fully elapsed.
          </p>
        </div>

        {/* Lead time & Grace period */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="number"
            min="0"
            max="120"
            label="Senior Reminder Lead Time (Minutes)"
            helperText="Minutes before dose to remind resident"
            value={formData.reminderLeadTimeMinutes}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                reminderLeadTimeMinutes: Number(e.target.value),
              }))
            }
          />
          <Input
            type="number"
            min="5"
            max="240"
            label="Missed-Dose Grace Period (Minutes)"
            helperText="Grace window after time before caregiver alert"
            value={formData.missedDoseGracePeriodMinutes}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                missedDoseGracePeriodMinutes: Number(e.target.value),
              }))
            }
          />
        </div>

        {/* Caregiver delay */}
        <div>
          <Input
            type="number"
            min="0"
            max="120"
            label="Caregiver Notification Delay (Minutes)"
            helperText="Additional wait time after grace period (0 = immediate alert)"
            value={formData.caregiverNotificationDelayMinutes}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                caregiverNotificationDelayMinutes: Number(e.target.value),
              }))
            }
          />
        </div>

        {/* Family Escalation Settings */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary-700" />
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Family Escalation Protocol
                </h4>
                <p className="text-xs text-slate-500">
                  Notify family if caregiver alert remains unconfirmed
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.familyEscalation.enabled}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    familyEscalation: {
                      ...prev.familyEscalation,
                      enabled: e.target.checked,
                    },
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {formData.familyEscalation.enabled && (
            <div className="pt-2">
              <Input
                type="number"
                min="5"
                max="240"
                label="Family Escalation Delay (Minutes)"
                helperText="Minutes after caregiver alert before notifying family circle"
                value={formData.familyEscalation.delayAfterCaregiverMinutes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    familyEscalation: {
                      ...prev.familyEscalation,
                      delayAfterCaregiverMinutes: Number(e.target.value),
                    },
                  }))
                }
              />
            </div>
          )}
        </div>

        {/* Notification Delivery Channels */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Delivery Channels
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formData.channels.inApp}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    channels: { ...prev.channels, inApp: e.target.checked },
                  }))
                }
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <Bell className="w-3.5 h-3.5 text-primary-700" />
              In-App Real-time Socket.IO Alerts
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formData.channels.email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    channels: { ...prev.channels, email: e.target.checked },
                  }))
                }
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <Mail className="w-3.5 h-3.5 text-primary-700" />
              Email Notifications (Nodemailer)
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ReminderSettingsModal;
