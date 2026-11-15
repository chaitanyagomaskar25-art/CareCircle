import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Filter,
  Pill,
  AlertTriangle,
  ShieldAlert,
  Settings,
  Mail,
  Smartphone,
  Calendar,
  Clock,
  RefreshCw,
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import StatusBadge from '../components/feedback/StatusBadge.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ReminderSettingsModal from '../components/notifications/ReminderSettingsModal.jsx';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notification.service.js';
import { useToast } from '../context/ToastContext.jsx';

export const NotificationsView = () => {
  const { success } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'unread' | 'reminders' | 'missed' | 'escalations'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await getMyNotifications({ limit: 50 });
      setNotifications(res?.notifications || []);
    } catch (err) {
      console.warn('Failed loading notification history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkOne = async (id) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id || n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
    );
    success('All Read', 'All notifications marked as read.');
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filterType === 'unread') return !item.readAt;
    if (filterType === 'reminders')
      return item.type === 'medication_reminder' || item.type === 'medication_due';
    if (filterType === 'missed') return item.type === 'missed_dose_caregiver';
    if (filterType === 'escalations') return item.type === 'missed_dose_family_escalation';
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'missed_dose_family_escalation':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
        );
      case 'missed_dose_caregiver':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      case 'medication_reminder':
      case 'medication_due':
        return (
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
        );
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Notification & Alert Center
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit history of medication reminders, caregiver missed-dose alerts, and family safety escalations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={CheckCheck}
              onClick={handleMarkAll}
            >
              Mark All Read
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            icon={Settings}
            onClick={() => setIsSettingsOpen(true)}
          >
            Reminder Settings
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Filter History:
          </span>
        </div>
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60 text-xs overflow-x-auto max-w-full">
          {[
            { id: 'all', label: `All (${notifications.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'reminders', label: 'Upcoming Reminders' },
            { id: 'missed', label: 'Caregiver Alerts' },
            { id: 'escalations', label: 'Family Escalations' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                filterType === f.id
                  ? 'bg-white text-primary-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      <Card>
        {filteredNotifications.length === 0 ? (
          <EmptyState
            title="No notifications match this filter"
            description="When automated medication reminders or caregiver alerts trigger, they will be logged here."
            actionLabel="Refresh List"
            onAction={loadNotifications}
          />
        ) : (
          <div className="divide-y divide-slate-100 -mx-4 -my-2">
            {filteredNotifications.map((item) => {
              const id = item._id || item.id;
              const isUnread = !item.readAt;

              return (
                <div
                  key={id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors ${
                    isUnread ? 'bg-primary-50/20' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {getNotificationIcon(item.type)}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={`text-sm font-bold ${
                            isUnread ? 'text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          {item.title}
                        </h4>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        )}
                        <span className="text-[11px] font-semibold text-slate-400 font-mono">
                          {new Date(item.sentAt).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Delivery channel chips */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          <Smartphone className="w-3 h-3 text-slate-500" />
                          In-App Socket.IO
                        </span>
                        {item.deliveryChannel === 'both' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            <Mail className="w-3 h-3 text-slate-500" />
                            Email Dispatched
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <StatusBadge
                      status={isUnread ? 'warning' : 'scheduled'}
                      label={isUnread ? 'Unread' : 'Read'}
                      size="sm"
                    />
                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Check}
                        onClick={() => handleMarkOne(id)}
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Reminder & Escalation Settings Modal */}
      <ReminderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        elderlyId="user-elderly"
      />
    </div>
  );
};

export default NotificationsView;
