import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as notificationService from '../services/notification.service.js';
import { runReminderJob } from '../jobs/reminderCron.js';

/**
 * Get paginated notifications for logged-in user.
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
  const { page, limit, unreadOnly } = req.query;
  const result = await notificationService.getUserNotifications(req.user._id, {
    page,
    limit,
    unreadOnly: unreadOnly === 'true',
  });

  return ApiResponse.success(res, 200, 'Notifications retrieved successfully', result);
});

/**
 * Get unread notification count.
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadNotificationCount(req.user._id);
  return ApiResponse.success(res, 200, 'Unread count retrieved', { unreadCount: count });
});

/**
 * Mark a single notification as read.
 */
export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await notificationService.markNotificationRead(id, req.user._id);

  if (!updated) {
    throw new ApiError(404, 'Notification not found or access denied.');
  }

  return ApiResponse.success(res, 200, 'Notification marked as read', updated);
});

/**
 * Mark all notifications as read for current user.
 */
export const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsRead(req.user._id);
  return ApiResponse.success(res, 200, 'All notifications marked as read', {
    modifiedCount: result.modifiedCount,
  });
});

/**
 * Get reminder settings for an elderly user.
 */
export const getReminderSettings = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const settings = await notificationService.getReminderSettings(elderlyId);
  return ApiResponse.success(res, 200, 'Reminder settings retrieved', settings);
});

/**
 * Update reminder settings for an elderly user.
 */
export const updateReminderSettings = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const settings = await notificationService.updateReminderSettings(elderlyId, req.body);
  return ApiResponse.success(res, 200, 'Reminder settings updated successfully', settings);
});

/**
 * Trigger reminder job cycle manually (for testing & verification).
 */
export const triggerReminderEngine = asyncHandler(async (req, res) => {
  const result = await runReminderJob();
  return ApiResponse.success(res, 200, 'Reminder engine executed', result);
});

export default {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
  getReminderSettings,
  updateReminderSettings,
  triggerReminderEngine,
};
