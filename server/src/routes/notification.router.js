import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireCareCirclePermission } from '../middlewares/careCircleAuth.middleware.js';
import * as notificationController from '../controllers/notification.controller.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Current user notifications
router.get('/', notificationController.getMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', notificationController.markNotificationRead);
router.patch('/read-all', notificationController.markAllRead);

// Reminder Settings for an elderly resident
router.get(
  '/settings/:elderlyId',
  requireCareCirclePermission('view_medications'),
  notificationController.getReminderSettings
);

router.put(
  '/settings/:elderlyId',
  requireCareCirclePermission('manage_medications'),
  notificationController.updateReminderSettings
);

// Trigger reminder engine manually (for integration tests & system diagnostics)
router.post('/trigger-engine', notificationController.triggerReminderEngine);

export default router;
