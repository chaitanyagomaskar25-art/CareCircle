import React from 'react';
import { Phone, AlertTriangle, ShieldAlert } from 'lucide-react';
import Button from '../common/Button.jsx';

export const EmergencyShortcutWidget = ({
  contacts = [],
  onOpenEmergencyModal,
  isUltraAccessible = false,
}) => {
  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 sm:p-8 shadow-card space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h2
              className={`
                font-black text-slate-900 tracking-tight
                ${isUltraAccessible ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}
              `}
            >
              Emergency Contact Shortcuts
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              One-touch calling to your loved ones and medical staff
            </p>
          </div>
        </div>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {contacts.map((contact) => (
          <a
            key={contact.id}
            href={`tel:${contact.phone}`}
            className="flex items-center justify-between p-5 rounded-2xl border-2 border-slate-200 hover:border-primary-600 bg-warm-50/70 hover:bg-primary-50/50 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-4 min-w-0">
              {contact.avatar ? (
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary-600 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-800 font-bold text-lg flex items-center justify-center shrink-0">
                  {contact.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <span className="text-xs font-bold text-primary-800 uppercase tracking-wider block">
                  {contact.relationship}
                </span>
                <h3
                  className={`
                    font-black text-slate-900 truncate
                    ${isUltraAccessible ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}
                  `}
                >
                  {contact.name}
                </h3>
                <p className="text-sm font-semibold text-slate-500 truncate mt-0.5">
                  {contact.phone}
                </p>
              </div>
            </div>

            <div className="w-12 h-12 rounded-xl bg-primary-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ml-2">
              <Phone className="w-6 h-6" />
            </div>
          </a>
        ))}
      </div>

      {/* Giant Red SOS Emergency Trigger */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onOpenEmergencyModal}
          className={`
            w-full py-5 px-6 rounded-2xl font-black text-white text-xl sm:text-2xl
            bg-rose-600 hover:bg-rose-700 active:bg-rose-800
            shadow-xl shadow-rose-600/30 transition-transform active:scale-[0.99]
            flex items-center justify-center gap-3 border-4 border-rose-500
            ${isUltraAccessible ? 'min-h-[76px]' : 'min-h-[64px]'}
          `}
        >
          <AlertTriangle className="w-7 h-7 shrink-0" />
          <span>🚨 PRESS FOR IMMEDIATE EMERGENCY HELP</span>
        </button>
      </div>
    </div>
  );
};

export default EmergencyShortcutWidget;
