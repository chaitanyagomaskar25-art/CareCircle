import React from 'react';
import { Users, Phone, Mail, Shield, Plus, HeartHandshake } from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import StatusBadge from '../components/feedback/StatusBadge.jsx';
import { mockCareCircleMembers } from '../services/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

export const CareCircleView = ({ onOpenEmergencyModal }) => {
  const { info } = useToast();

  const handleInvite = () => {
    info('Invitation Link Generated', 'Care circle invitation email link copied to clipboard.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Care Circle Network</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Connected family caregivers, nurses, and medical providers collaborating on care
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={Phone} onClick={onOpenEmergencyModal}>
            Emergency Call Tree
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleInvite}>
            Invite Member
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {mockCareCircleMembers.map((member) => (
          <Card key={member.id} className="p-0">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-primary-600 shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                      {member.isEmergencyContact && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          Priority 1
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-primary-800">{member.role}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Last active: {member.lastActive}</p>
                  </div>
                </div>
                <StatusBadge
                  status={member.status === 'online' ? 'active' : 'neutral'}
                  label={member.status === 'online' ? 'Online' : 'Offline'}
                  size="sm"
                />
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${member.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-primary-800 bg-primary-50 hover:bg-primary-100 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CareCircleView;
