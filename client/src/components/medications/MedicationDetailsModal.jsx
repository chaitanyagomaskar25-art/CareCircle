import React from 'react';
import { Pill, Edit2, AlertTriangle, Calendar, Clock, User, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import StatusBadge from '../feedback/StatusBadge.jsx';

export const MedicationDetailsModal = ({
  isOpen,
  onClose,
  medication,
  onEdit,
  onDiscontinue,
}) => {
  if (!medication) return null;

  const isLowStock =
    (medication.remainingInventory ?? medication.remainingPills ?? 30) <=
    (medication.refillThreshold ?? 7);

  const remaining = medication.remainingInventory ?? medication.remainingPills ?? 0;
  const threshold = medication.refillThreshold ?? 7;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={medication.medicineName || medication.name}
      subtitle={`Dosage: ${medication.dosage} • ${medication.purpose || medication.description || 'Prescription Medication'}`}
      footer={
        <div className="flex items-center justify-between w-full">
          {medication.status !== 'discontinued' ? (
            <Button
              variant="outline"
              className="text-rose-600 hover:bg-rose-50 border-rose-200"
              onClick={() => onDiscontinue(medication)}
            >
              Discontinue
            </Button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              icon={Edit2}
              onClick={() => {
                onClose();
                onEdit(medication);
              }}
            >
              Edit Prescription
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Status bar */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-800 flex items-center justify-center font-bold">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Prescription Status</p>
              <p className="text-sm font-bold text-slate-900 capitalize">{medication.status || 'Active'}</p>
            </div>
          </div>
          <StatusBadge
            status={medication.status === 'discontinued' ? 'inactive' : 'success'}
            label={medication.status === 'discontinued' ? 'Discontinued' : 'Active Plan'}
          />
        </div>

        {/* Administration Instructions */}
        <div className="p-4 bg-teal-50/70 rounded-xl border border-teal-200/70">
          <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            Doctor's Directions & Instructions
          </h4>
          <p className="text-sm text-teal-950 font-medium leading-relaxed">
            {medication.instructions || 'Take as instructed by your healthcare physician.'}
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-xs text-slate-500 block font-medium">Daily Scheduled Times</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(medication.scheduledTimes || [medication.scheduledTime || '08:00']).map((time, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-primary-50 text-primary-800 text-xs font-bold font-mono border border-primary-200/60"
                >
                  <Clock className="w-3 h-3" />
                  {time}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-xs text-slate-500 block font-medium">Frequency</span>
            <span className="text-sm font-bold text-slate-900 capitalize mt-1 block">
              {(medication.frequency || 'daily').replace('_', ' ')}
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-xs text-slate-500 block font-medium">Pill Appearance</span>
            <span className="text-sm font-semibold text-slate-800 mt-1 block">
              {medication.pillAppearance || 'Standard medical tablet/capsule'}
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-xs text-slate-500 block font-medium">Prescribing Physician</span>
            <span className="text-sm font-semibold text-slate-800 mt-1 block flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {medication.prescribedBy || 'Assigned Family Physician'}
            </span>
          </div>
        </div>

        {/* Inventory and Refill Alert Card */}
        <div className={`p-4 rounded-xl border ${isLowStock ? 'bg-rose-50/80 border-rose-200' : 'bg-slate-50 border-slate-200/80'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isLowStock ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Pill Inventory & Refill Status
              </h5>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isLowStock ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {isLowStock ? 'Refill Recommended' : 'Stock Sufficient'}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-slate-600 text-xs">Remaining in pillbox:</span>
            <span className="font-extrabold text-slate-900 text-base">
              {remaining} <span className="text-xs font-normal text-slate-500">pills</span>
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${isLowStock ? 'bg-rose-500' : 'bg-primary-600'}`}
              style={{ width: `${Math.min(100, Math.max(5, (remaining / 30) * 100))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Refill threshold trigger is set at {threshold} pills.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default MedicationDetailsModal;
