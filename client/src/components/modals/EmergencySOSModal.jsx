import React from 'react';
import { Phone, AlertTriangle, ShieldAlert, HeartPulse, User } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { mockElderlyProfile, mockCareCircleMembers } from '../../services/mockData.js';

export const EmergencySOSModal = ({ isOpen, onClose, isElderly = false }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Emergency Care Escalation Tree"
      subtitle={`Immediate emergency dispatch and contact tree for ${mockElderlyProfile.preferredName}`}
      size="lg"
      isElderly={isElderly}
      footer={
        <Button variant="outline" onClick={onClose} size={isElderly ? 'lg' : 'md'}>
          Close Alert Panel
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Critical Medical Warnings */}
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-200/80 text-rose-800 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-rose-950 text-base">Resident Medical Alert</h4>
            <p className="text-xs sm:text-sm text-rose-900 mt-0.5">
              Location: <strong>{mockElderlyProfile.room}</strong> ({mockElderlyProfile.emergencyAddress})
            </p>
            <p className="text-xs text-rose-700 font-semibold mt-1">
              Known Allergies: {mockElderlyProfile.allergies.join(', ')} • Blood Group: {mockElderlyProfile.bloodType}
            </p>
          </div>
        </div>

        {/* Emergency Escalation Contacts */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Designated First Responders & Caregivers
          </h4>

          {mockCareCircleMembers
            .filter((m) => m.isEmergencyContact)
            .map((contact, idx) => (
              <div
                key={contact.id}
                className="p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-primary-600 flex items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-800 font-black text-sm flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h5 className="font-bold text-slate-900 text-base">{contact.name}</h5>
                    <p className="text-xs font-semibold text-primary-800">{contact.role}</p>
                    <p className="text-xs text-slate-500">{contact.phone}</p>
                  </div>
                </div>

                <a
                  href={`tel:${contact.phone}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Now</span>
                </a>
              </div>
            ))}

          {/* 911 / EMS Direct Call */}
          <div className="p-4 rounded-2xl bg-rose-600 text-white flex items-center justify-between gap-4 shadow-lg shadow-rose-600/20">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <h5 className="font-black text-base">Emergency Services (911)</h5>
                <p className="text-xs text-rose-100">National Emergency Dispatch & Paramedics</p>
              </div>
            </div>
            <a
              href="tel:911"
              className="px-5 py-2.5 rounded-xl bg-white text-rose-700 font-extrabold text-sm shadow-sm hover:bg-rose-50 transition-colors"
            >
              Dial 911
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EmergencySOSModal;
