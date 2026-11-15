import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Pill,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/notification.service.js';
import { useToast } from '../../context/ToastContext.jsx';
import { io } from 'socket.io-client';

export const NotificationBell = ({ onOpenAllNotifications }) => {
  const { info, warning } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnread = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count || 0);
    } catch (e) {
      // ignore
    }
  };

  const fetchRecentNotifications = async () => {
    setLoading(true);
    try {
      const res = await getMyNotifications({ limit: 6 });
      setNotifications(res?.notifications || []);
      setUnreadCount(res?.pagination?.unreadCount ?? 0);
    } catch (e) {
      console.warn('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnread();

    // Setup Socket.IO listener for real-time notifications
    let socket = null;
    try {
      const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      socket = io(socketUrl, { transports: ['websocket', 'polling'] });

      socket.on('notification', (notif) => {
        setUnreadCount((prev) => prev + 1);
        setNotifications((prev) => [
          {
            _id: `socket-${Date.now()}`,
            id: `socket-${Date.now()}`,
            ...notif,
            sentAt: new Date().toISOString(),
            readAt: null,
          },
          ...prev,
        ]);

        if (notif.type?.includes('missed') || notif.type?.includes('escalation')) {
          warning(notif.title || 'Urgent Care Alert', notif.message);
        } else {
          info(notif.title || 'Medication Reminder', notif.message);
        }
      });
    } catch (err) {
      // Non-blocking socket fallback
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchRecentNotifications();
    }
    setIsOpen((prev) => !prev);
  };

  const handleMarkOne = async (e, id) => {
    e.stopPropagation();
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id || n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'missed_dose_family_escalation':
        return <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'missed_dose_caregiver':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'medication_reminder':
      case 'medication_due':
        return <Pill className="w-4 h-4 text-teal-600 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-primary-600 shrink-0" />;
    }
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Just now';
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-600 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-800">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List items */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No notifications right now. Everything is running smoothly!
              </div>
            ) : (
              notifications.map((item) => {
                const id = item._id || item.id;
                const isUnread = !item.readAt;

                return (
                  <div
                    key={id}
                    onClick={() => {
                      if (isUnread) markNotificationRead(id);
                    }}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      isUnread ? 'bg-primary-50/30 hover:bg-primary-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="mt-0.5">{getNotificationIcon(item.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-bold truncate ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatRelativeTime(item.sentAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.message}
                      </p>
                    </div>

                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkOne(e, id)}
                        title="Mark as read"
                        className="p-1 rounded text-slate-400 hover:text-primary-700 hover:bg-slate-100 transition-colors shrink-0"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onOpenAllNotifications) onOpenAllNotifications();
              }}
              className="w-full py-1 text-xs font-bold text-primary-700 hover:text-primary-800 transition-colors inline-flex items-center justify-center gap-1"
            >
              <span>View Full Notification History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
