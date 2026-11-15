import cron from 'node-cron';
import {
  checkUpcomingReminders,
  checkMissedDosesAndEscalate,
} from '../services/notification.service.js';
import { checkUpcomingAppointmentReminders } from '../services/appointment.service.js';

let cronTask = null;
let isJobRunning = false;

/**
 * Execute a single cycle of the reminder & missed-dose escalation checks.
 * Uses a mutual exclusion lock to strictly avoid overlapping scheduled runs.
 */
export const runReminderJob = async () => {
  if (isJobRunning) {
    console.log('[ReminderCron] Previous cycle is still running. Skipping to avoid overlap.');
    return { skipped: true };
  }

  isJobRunning = true;
  const startTime = Date.now();

  try {
    // 1. Process upcoming medication dose reminders
    const upcomingDispatched = await checkUpcomingReminders();

    // 2. Process missed doses and caregiver/family escalations
    const missedDispatched = await checkMissedDosesAndEscalate();

    // 3. Process upcoming doctor appointment reminders (24h & 2h windows)
    const appointmentsDispatched = await checkUpcomingAppointmentReminders();

    const duration = Date.now() - startTime;
    if (
      upcomingDispatched.length > 0 ||
      missedDispatched.length > 0 ||
      appointmentsDispatched.length > 0
    ) {
      console.log(
        `[ReminderCron] Cycle completed in ${duration}ms: ` +
        `${upcomingDispatched.length} upcoming med reminders, ` +
        `${missedDispatched.length} missed/escalation alerts, ` +
        `${appointmentsDispatched.length} appointment reminders.`
      );
    }

    return {
      success: true,
      upcomingCount: upcomingDispatched.length,
      missedCount: missedDispatched.length,
      appointmentCount: appointmentsDispatched.length,
      durationMs: duration,
    };
  } catch (err) {
    console.error('[ReminderCron] Unexpected error during reminder engine execution:', err);
    return { success: false, error: err.message };
  } finally {
    isJobRunning = false;
  }
};

/**
 * Initialize the cron scheduler.
 * Runs every minute in production and development: `* * * * *`.
 */
export const initReminderCron = (cronExpression = '* * * * *') => {
  if (cronTask) {
    console.log('[ReminderCron] Cron task already running.');
    return cronTask;
  }

  console.log(`[ReminderCron] Initializing automated reminder engine with schedule "${cronExpression}"`);
  cronTask = cron.schedule(cronExpression, async () => {
    await runReminderJob();
  });

  return cronTask;
};

/**
 * Stop the cron scheduler during shutdown or test teardown.
 */
export const stopReminderCron = () => {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    console.log('[ReminderCron] Cron scheduler stopped.');
  }
};

export default {
  runReminderJob,
  initReminderCron,
  stopReminderCron,
};
