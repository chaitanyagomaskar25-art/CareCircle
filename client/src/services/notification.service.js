import api from './api.js';

const STORAGE_KEY = 'carecircle_notifications_state';
const SETTINGS_KEY = 'carecircle_reminder_settings_state';

const getInitialNotifications = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed parsing saved notifications', e);
    }
  }

  const now = Date.now();
  return [
    {
      id: 'notif-1',
      _id: 'notif-1',
      type: 'missed_dose_caregiver',
      title: 'Missed Dose Alert: Lisinopril 10mg',
      message: 'Grandma Eleanor has not confirmed taking Lisinopril 10mg scheduled for 08:00 AM. The 30-minute grace period has passed.',
      deliveryChannel: 'both',
      status: 'delivered',
      sentAt: new Date(now - 45 * 60 * 1000).toISOString(),
      readAt: null,
      metadata: {
        timeStr: '08:00 AM',
        seniorName: 'Grandma Eleanor',
      },
    },
    {
      id: 'notif-2',
      _id: 'notif-2',
      type: 'medication_reminder',
      title: 'Reminder: Metformin 500mg',
      message: 'It is almost time for Metformin 500mg scheduled at 12:30 PM. Please ensure taken with lunch.',
      deliveryChannel: 'both',
      status: 'delivered',
      sentAt: new Date(now - 120 * 60 * 1000).toISOString(),
      readAt: new Date(now - 110 * 60 * 1000).toISOString(),
      metadata: {
        timeStr: '12:30 PM',
        seniorName: 'Grandma Eleanor',
      },
    },
    {
      id: 'notif-3',
      _id: 'notif-3',
      type: 'inventory_refill',
      title: 'Low Inventory Warning: Atorvastatin',
      message: 'Atorvastatin 20mg only has 5 pills remaining. Refill threshold is 7 pills.',
      deliveryChannel: 'in_app',
      status: 'delivered',
      sentAt: new Date(now - 300 * 60 * 1000).toISOString(),
      readAt: null,
      metadata: {
        remainingPills: 5,
      },
    },
    {
      id: 'notif-4',
      _id: 'notif-4',
      type: 'missed_dose_family_escalation',
      title: 'Escalation Alert: Morning Blood Pressure Check',
      message: 'Caregiver notification was dispatched 30 minutes ago and medication remains unconfirmed. Please check in.',
      deliveryChannel: 'both',
      status: 'delivered',
      sentAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(now - 23 * 60 * 60 * 1000).toISOString(),
      metadata: {
        seniorName: 'Grandma Eleanor',
      },
    },
  ];
};

const getInitialSettings = () => {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed parsing saved reminder settings', e);
    }
  }

  return {
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
  };
};

let notifications = getInitialNotifications();
let reminderSettings = getInitialSettings();

const persist = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(reminderSettings));
};

export const getMyNotifications = async ({ page = 1, limit = 20, unreadOnly = false } = {}) => {
  try {
    const res = await api.get('/notifications', { params: { page, limit, unreadOnly } });
    if (res.data) return res.data;
  } catch (err) {
    // fallback
  }

  let filtered = [...notifications];
  if (unreadOnly) {
    filtered = filtered.filter((n) => !n.readAt);
  }

  return {
    notifications: filtered,
    pagination: {
      total: filtered.length,
      page: 1,
      limit: 50,
      pages: 1,
      unreadCount: notifications.filter((n) => !n.readAt).length,
    },
  };
};

export const getUnreadCount = async () => {
  try {
    const res = await api.get('/notifications/unread-count');
    if (res.data && typeof res.data.unreadCount === 'number') {
      return res.data.unreadCount;
    }
  } catch (err) {
    // fallback
  }

  return notifications.filter((n) => !n.readAt).length;
};

export const markNotificationRead = async (id) => {
  try {
    const res = await api.patch(`/notifications/${id}/read`);
    if (res.data) return res.data;
  } catch (err) {
    // fallback
  }

  notifications = notifications.map((n) => {
    if (n.id === id || n._id === id) {
      return { ...n, readAt: new Date().toISOString(), status: 'read' };
    }
    return n;
  });

  persist();
  return notifications.find((n) => n.id === id || n._id === id);
};

export const markAllNotificationsRead = async () => {
  try {
    const res = await api.patch('/notifications/read-all');
    if (res.data) return res.data;
  } catch (err) {
    // fallback
  }

  const now = new Date().toISOString();
  notifications = notifications.map((n) => ({
    ...n,
    readAt: n.readAt || now,
    status: 'read',
  }));

  persist();
  return { modifiedCount: notifications.length };
};

export const getReminderSettings = async (elderlyId = 'user-elderly') => {
  try {
    const res = await api.get(`/notifications/settings/${elderlyId}`);
    if (res.data) return res.data;
  } catch (err) {
    // fallback
  }

  return reminderSettings;
};

export const updateReminderSettings = async (elderlyId = 'user-elderly', updates) => {
  try {
    const res = await api.put(`/notifications/settings/${elderlyId}`, updates);
    if (res.data) {
      reminderSettings = res.data;
      persist();
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  reminderSettings = { ...reminderSettings, ...updates };
  persist();
  return reminderSettings;
};

export default {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  getReminderSettings,
  updateReminderSettings,
};
