import { Notification } from '../models/notification.model.js';
import { ReminderSettings } from '../models/reminderSettings.model.js';
import { MedicationLog } from '../models/medicationLog.model.js';
import { Medication } from '../models/medication.model.js';
import { CareRelationship } from '../models/careRelationship.model.js';
import { User } from '../models/user.model.js';
import { sendEmail, buildNotificationEmailHtml } from './email.service.js';
import { emitToUser, emitToCircle } from '../sockets/socket.js';
import { env } from '../config/env.js';

/**
 * Get or initialize default reminder settings for an elderly user.
 */
export const getReminderSettings = async (elderlyUserId) => {
  let settings = await ReminderSettings.findOne({ elderlyUserId });
  if (!settings) {
    const elderlyUser = await User.findById(elderlyUserId);
    settings = await ReminderSettings.create({
      elderlyUserId,
      timezone: elderlyUser?.timezone || 'UTC',
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
  }
  return settings;
};

/**
 * Update reminder settings for an elderly user.
 */
export const updateReminderSettings = async (elderlyUserId, updates) => {
  let settings = await ReminderSettings.findOneAndUpdate(
    { elderlyUserId },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  );
  return settings;
};

/**
 * Send a notification through in-app Socket.IO and/or Email.
 * Enforces strict idempotency to prevent duplicate notifications.
 */
export const sendNotification = async ({
  recipientId,
  elderlyUserId,
  type,
  title,
  message,
  relatedEntityId = null,
  deliveryChannel = 'both',
  idempotencyKey = null,
  metadata = {},
}) => {
  // 1. Idempotency Check: Avoid sending duplicate notifications
  if (idempotencyKey) {
    const existing = await Notification.findOne({ idempotencyKey });
    if (existing) {
      return { duplicate: true, notification: existing };
    }
  }

  // 2. Fetch recipient details and notification preferences
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    throw new Error(`Notification recipient ${recipientId} not found`);
  }

  const prefs = recipient.notificationPreferences || { email: true, inApp: true };
  const shouldSendEmail =
    (deliveryChannel === 'email' || deliveryChannel === 'both') && prefs.email !== false;
  const shouldSendInApp =
    (deliveryChannel === 'in_app' || deliveryChannel === 'both') && prefs.inApp !== false;

  let emailDelivered = false;
  let socketDelivered = false;
  let failureReason = null;

  // 3. Dispatch In-App Socket.IO Notification
  if (shouldSendInApp) {
    socketDelivered = emitToUser(recipientId, 'notification', {
      type,
      title,
      message,
      relatedEntityId,
      elderlyUserId,
      createdAt: new Date().toISOString(),
      metadata,
    });
  }

  // 4. Dispatch Email Notification (Non-blocking with error safety)
  if (shouldSendEmail && recipient.email) {
    try {
      const emailHtml = buildNotificationEmailHtml({
        title,
        message,
        seniorName: metadata.seniorName,
        timeStr: metadata.timeStr,
        actionLabel: 'Open CareCircle Dashboard',
        actionUrl: `${env.CLIENT_URL}/dashboard`,
      });

      // Fire email asynchronously without blocking API threads
      sendEmail({
        to: recipient.email,
        subject: `CareCircle Alert: ${title}`,
        text: `${title}\n\n${message}\n\nPlease check your CareCircle dashboard at ${env.CLIENT_URL}`,
        html: emailHtml,
      }).then((res) => {
        if (!res.success) {
          console.warn(`[NotificationService] Email delivery reported issue for ${recipient.email}: ${res.error}`);
        }
      }).catch((err) => {
        console.error(`[NotificationService] Email dispatch failed for ${recipient.email}:`, err.message);
      });

      emailDelivered = true;
    } catch (err) {
      failureReason = err.message;
      console.error('[NotificationService] Email build error:', err);
    }
  }

  // 5. Persist Notification Document with Idempotency Key
  try {
    const doc = await Notification.create({
      recipientId,
      elderlyUserId,
      type,
      title,
      message,
      relatedEntityId,
      deliveryChannel,
      status: 'delivered',
      sentAt: new Date(),
      idempotencyKey,
      metadata,
      deliveryDetails: {
        emailDelivered,
        socketDelivered,
        failureReason,
      },
    });

    return { duplicate: false, notification: doc };
  } catch (err) {
    if (err.code === 11000) {
      // Race condition hit idempotency key - duplicate caught safely
      const existing = await Notification.findOne({ idempotencyKey });
      return { duplicate: true, notification: existing };
    }
    throw err;
  }
};

/**
 * Scan today's pending doses and dispatch upcoming reminders to elderly residents.
 */
export const checkUpcomingReminders = async () => {
  const now = new Date();

  // Find all pending doses scheduled within next 120 minutes or currently in reminder window
  const pendingDoses = await MedicationLog.find({
    status: 'pending',
    scheduledAt: {
      $gte: new Date(now.getTime() - 60 * 60 * 1000), // up to 1 hr past
      $lte: new Date(now.getTime() + 120 * 60 * 1000), // up to 2 hrs ahead
    },
  }).populate('medicationId');

  const dispatched = [];

  for (const dose of pendingDoses) {
    const med = dose.medicationId;
    if (!med || med.status === 'discontinued') continue;

    const settings = await getReminderSettings(dose.elderlyUserId);
    const leadTimeMs = (settings.reminderLeadTimeMinutes || 15) * 60 * 1000;
    const scheduledTimeMs = new Date(dose.scheduledAt).getTime();
    const reminderStartMs = scheduledTimeMs - leadTimeMs;

    // Is it time for the upcoming reminder?
    if (now.getTime() >= reminderStartMs && now.getTime() < scheduledTimeMs) {
      const senior = await User.findById(dose.elderlyUserId);
      const medName = med.medicineName || 'Medication';
      const dosage = med.dosage || '';
      const timeStr = dose.scheduledTimeStr || new Date(dose.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const idempotencyKey = `reminder:${dose._id}:${dose.elderlyUserId}:both`;

      const result = await sendNotification({
        recipientId: dose.elderlyUserId,
        elderlyUserId: dose.elderlyUserId,
        type: 'medication_reminder',
        title: `Reminder: ${medName} ${dosage}`,
        message: `It is almost time for your scheduled ${medName} ${dosage} at ${timeStr}. Please take with water as instructed.`,
        relatedEntityId: dose._id,
        deliveryChannel: 'both',
        idempotencyKey,
        metadata: {
          doseId: dose._id.toString(),
          scheduledTime: dose.scheduledAt,
          timeStr,
          seniorName: senior?.name,
        },
      });

      if (!result.duplicate) {
        dispatched.push(result.notification);
      }
    }
  }

  return dispatched;
};

/**
 * Scan for unconfirmed doses where the grace period has elapsed.
 * 1. Mark dose as missed.
 * 2. Alert assigned caregivers.
 * 3. Escalate to family members if configured.
 *
 * RULE: Must NOT claim that a medicine was missed until the defined grace period has elapsed.
 */
export const checkMissedDosesAndEscalate = async () => {
  const now = new Date();

  // Find all pending or missed doses scheduled earlier today
  const candidateDoses = await MedicationLog.find({
    status: { $in: ['pending', 'missed'] },
    scheduledAt: {
      $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // within last 24 hours
      $lte: now, // already reached or passed scheduled time
    },
  }).populate('medicationId');

  const alerts = [];

  for (const dose of candidateDoses) {
    const med = dose.medicationId;
    if (!med || med.status === 'discontinued') continue;

    const settings = await getReminderSettings(dose.elderlyUserId);
    const scheduledMs = new Date(dose.scheduledAt).getTime();
    const gracePeriodMs = (settings.missedDoseGracePeriodMinutes || 30) * 60 * 1000;
    const graceExpiryMs = scheduledMs + gracePeriodMs;

    // RULE ENFORCEMENT: If grace period has NOT elapsed, DO NOT treat as missed!
    if (now.getTime() < graceExpiryMs) {
      continue;
    }

    // Grace period has elapsed and dose is unconfirmed!
    if (dose.status === 'pending') {
      dose.status = 'missed';
      await dose.save();
    }

    const senior = await User.findById(dose.elderlyUserId);
    const seniorName = senior?.name || 'Grandma Eleanor';
    const medName = med.medicineName || 'Medication';
    const dosage = med.dosage || '';
    const timeStr = dose.scheduledTimeStr || new Date(dose.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Notify Assigned Caregivers
    const caregiverRelationships = await CareRelationship.find({
      elderlyUserId: dose.elderlyUserId,
      invitationStatus: 'accepted',
      permissions: { $in: ['manage_medications', 'view_medications'] },
    });

    for (const rel of caregiverRelationships) {
      const caregiverId = rel.memberUserId;
      const idempotencyKey = `missed_caregiver:${dose._id}:${caregiverId}:both`;

      const careResult = await sendNotification({
        recipientId: caregiverId,
        elderlyUserId: dose.elderlyUserId,
        type: 'missed_dose_caregiver',
        title: `Missed Dose Alert: ${seniorName} - ${medName}`,
        message: `${seniorName} has not confirmed taking ${medName} ${dosage} scheduled for ${timeStr}. The ${settings.missedDoseGracePeriodMinutes}-minute grace period has passed.`,
        relatedEntityId: dose._id,
        deliveryChannel: 'both',
        idempotencyKey,
        metadata: {
          doseId: dose._id.toString(),
          scheduledTime: dose.scheduledAt,
          timeStr,
          seniorName,
        },
      });

      if (!careResult.duplicate) {
        alerts.push(careResult.notification);
      }
    }

    // 2. Family Escalation
    if (settings.familyEscalation?.enabled) {
      const escalationDelayMs = (settings.familyEscalation.delayAfterCaregiverMinutes || 30) * 60 * 1000;
      const escalationTriggerMs = graceExpiryMs + escalationDelayMs;

      if (now.getTime() >= escalationTriggerMs) {
        const familyRelationships = await CareRelationship.find({
          elderlyUserId: dose.elderlyUserId,
          relationshipType: { $in: ['daughter', 'son', 'spouse', 'grandchild', 'family'] },
          invitationStatus: 'accepted',
        });

        for (const rel of familyRelationships) {
          const familyMemberId = rel.memberUserId;
          const idempotencyKey = `missed_family:${dose._id}:${familyMemberId}:both`;

          const famResult = await sendNotification({
            recipientId: familyMemberId,
            elderlyUserId: dose.elderlyUserId,
            type: 'missed_dose_family_escalation',
            title: `URGENT ESCALATION: Missed Dose for ${seniorName}`,
            message: `Caregiver notification was dispatched ${settings.familyEscalation.delayAfterCaregiverMinutes} minutes ago, but ${seniorName}'s ${medName} ${dosage} (${timeStr}) remains unconfirmed. Please check in immediately.`,
            relatedEntityId: dose._id,
            deliveryChannel: 'both',
            idempotencyKey,
            metadata: {
              doseId: dose._id.toString(),
              scheduledTime: dose.scheduledAt,
              timeStr,
              seniorName,
            },
          });

          if (!famResult.duplicate) {
            alerts.push(famResult.notification);
          }
        }
      }
    }
  }

  return alerts;
};

/**
 * Query paginated notifications for a recipient.
 */
export const getUserNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const query = { recipientId: userId };
  if (unreadOnly) {
    query.readAt = null;
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const parsedLimit = parseInt(limit, 10);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate('elderlyUserId', 'name profileImage email phone')
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipientId: userId, readAt: null }),
  ]);

  return {
    notifications,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parsedLimit,
      pages: Math.ceil(total / parsedLimit) || 1,
      unreadCount,
    },
  };
};

/**
 * Mark a single notification as read.
 */
export const markNotificationRead = async (notificationId, userId) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId },
    { $set: { readAt: new Date(), status: 'read' } },
    { new: true }
  );
  return notif;
};

/**
 * Mark all notifications as read for a user.
 */
export const markAllNotificationsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipientId: userId, readAt: null },
    { $set: { readAt: new Date(), status: 'read' } }
  );
  return result;
};

/**
 * Get quick unread count for badge.
 */
export const getUnreadNotificationCount = async (userId) => {
  return Notification.countDocuments({ recipientId: userId, readAt: null });
};

export default {
  getReminderSettings,
  updateReminderSettings,
  sendNotification,
  checkUpcomingReminders,
  checkMissedDosesAndEscalate,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
};
