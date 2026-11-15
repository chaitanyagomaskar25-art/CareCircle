import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { Notification } from '../src/models/notification.model.js';
import { ReminderSettings } from '../src/models/reminderSettings.model.js';
import { Medication } from '../src/models/medication.model.js';
import { MedicationLog } from '../src/models/medicationLog.model.js';
import { CareRelationship } from '../src/models/careRelationship.model.js';
import { User } from '../src/models/user.model.js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runNotificationEngineTests() {
  console.log('--- STARTING NOTIFICATION & REMINDER ENGINE VERIFICATION TESTS ---');
  let passed = 0;
  let failed = 0;

  // Connect Mongoose for test database assertions & time offsets
  await mongoose.connect(env.MONGODB_URI);

  const assert = (condition, testName, extraInfo = '') => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}: ${extraInfo}`);
      failed++;
    }
  };

  try {
    const ts = Date.now();
    const seniorEmail = `notif_senior_${ts}@carecircle.test`;
    const nurseEmail = `notif_nurse_${ts}@carecircle.test`;
    const daughterEmail = `notif_daughter_${ts}@carecircle.test`;

    // 1. Setup User Accounts (Senior, Nurse, Daughter)
    console.log('\n[1] Registering Accounts for Notification Engine Testing...');

    const resSenior = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Eleanor Vance',
        email: seniorEmail,
        password: 'Password123!',
        phone: '+1 555-0101',
        role: 'elderly',
      }),
    });
    const seniorJson = await resSenior.json();
    const seniorToken = seniorJson.data.token;
    const seniorId = seniorJson.data.user._id;
    assert(resSenior.status === 201, 'Senior Eleanor registered successfully');

    const resNurse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Nurse Marcus, RN',
        email: nurseEmail,
        password: 'Password123!',
        phone: '+1 555-0102',
        role: 'caregiver',
      }),
    });
    const nurseJson = await resNurse.json();
    const nurseToken = nurseJson.data.token;
    const nurseId = nurseJson.data.user._id;
    assert(resNurse.status === 201, 'Caregiver Marcus registered successfully');

    const resDaughter = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sarah Vance',
        email: daughterEmail,
        password: 'Password123!',
        phone: '+1 555-0103',
        role: 'family',
      }),
    });
    const daughterJson = await resDaughter.json();
    const daughterToken = daughterJson.data.token;
    const daughterId = daughterJson.data.user._id;
    assert(resDaughter.status === 201, 'Family member Sarah registered successfully');

    // 2. Authorize Caregiver and Family in Care Circle
    console.log('\n[2] Setting up Care Circle Relationships & Permissions...');
    const invNurse = await fetch(`${BASE_URL}/care-circle/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        elderlyUserId: seniorId,
        inviteeEmail: nurseEmail,
        relationshipType: 'nurse',
        permissions: ['view_medications', 'manage_medications'],
      }),
    });
    const invNurseJson = await invNurse.json();
    const nurseInviteToken = invNurseJson.data.invitationToken;

    const acceptNurse = await fetch(`${BASE_URL}/care-circle/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurseToken}`,
      },
      body: JSON.stringify({ token: nurseInviteToken }),
    });
    assert(acceptNurse.status === 200, 'Nurse Marcus accepted into Care Circle');

    const invDaughter = await fetch(`${BASE_URL}/care-circle/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        elderlyUserId: seniorId,
        inviteeEmail: daughterEmail,
        relationshipType: 'daughter',
        permissions: ['view_medications'],
      }),
    });
    const invDaughterJson = await invDaughter.json();
    const daughterInviteToken = invDaughterJson.data.invitationToken;

    const acceptDaughter = await fetch(`${BASE_URL}/care-circle/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${daughterToken}`,
      },
      body: JSON.stringify({ token: daughterInviteToken }),
    });
    assert(acceptDaughter.status === 200, 'Daughter Sarah accepted into Care Circle as family');

    // 3. Test Configurable Reminder Settings API
    console.log('\n[3] Testing Configurable Reminder Settings API...');
    const resGetSettings = await fetch(`${BASE_URL}/notifications/settings/${seniorId}`, {
      headers: { Authorization: `Bearer ${seniorToken}` },
    });
    const getSettingsJson = await resGetSettings.json();
    assert(resGetSettings.status === 200, 'Retrieved default reminder settings');
    assert(getSettingsJson.data.reminderLeadTimeMinutes === 15, 'Default reminder lead time is 15 mins');
    assert(getSettingsJson.data.missedDoseGracePeriodMinutes === 30, 'Default missed dose grace period is 30 mins');
    assert(getSettingsJson.data.familyEscalation.enabled === true, 'Default family escalation is enabled');

    // Update reminder settings: 10 mins lead time, 20 mins grace period
    const resUpdateSettings = await fetch(`${BASE_URL}/notifications/settings/${seniorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        reminderLeadTimeMinutes: 10,
        missedDoseGracePeriodMinutes: 20,
        familyEscalation: {
          enabled: true,
          delayAfterCaregiverMinutes: 15,
        },
      }),
    });
    const updateSettingsJson = await resUpdateSettings.json();
    assert(resUpdateSettings.status === 200, 'Successfully updated reminder settings');
    assert(updateSettingsJson.data.reminderLeadTimeMinutes === 10, 'Updated reminder lead time verified');
    assert(updateSettingsJson.data.missedDoseGracePeriodMinutes === 20, 'Updated grace period verified');

    // 4. Test Upcoming Medication Dose Reminder Scheduling
    console.log('\n[4] Testing Upcoming Medication Dose Reminders...');
    const resMed = await fetch(`${BASE_URL}/medications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        elderlyUserId: seniorId,
        medicineName: 'Amlodipine',
        dosage: '5mg',
        instructions: 'Take 1 tablet with water',
        frequency: 'daily',
        scheduledTimes: ['14:00'],
        remainingInventory: 30,
        refillThreshold: 5,
      }),
    });
    const medJson = await resMed.json();
    const medId = medJson.data._id;
    assert(resMed.status === 201, 'Created Amlodipine prescription');

    // Create upcoming dose within active 10-minute reminder lead window (5 minutes in future)
    const upcomingDoseTime = new Date(Date.now() + 5 * 60 * 1000);
    const upcomingDose = await MedicationLog.create({
      medicationId: medId,
      elderlyUserId: seniorId,
      scheduledTimeStr: '14:00',
      scheduledAt: upcomingDoseTime,
      status: 'pending',
    });
    assert(Boolean(upcomingDose), 'Upcoming dose record created for lead-time testing');

    // Run reminder engine
    await fetch(`${BASE_URL}/notifications/trigger-engine`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${seniorToken}` },
    });

    // Verify upcoming reminder notification was created
    const reminderNotif = await Notification.findOne({
      elderlyUserId: seniorId,
      relatedEntityId: upcomingDose._id,
      type: 'medication_reminder',
    });
    assert(Boolean(reminderNotif), 'Upcoming dose reminder detected and dispatched');
    assert(reminderNotif?.title.includes('Reminder: Amlodipine'), 'Reminder notification title verified');

    // 5. Test Duplicate Prevention (Idempotency)
    console.log('\n[5] Testing Idempotent Notification Processing (Duplicate Prevention)...');
    const resEngine2 = await fetch(`${BASE_URL}/notifications/trigger-engine`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${seniorToken}` },
    });
    const engine2Json = await resEngine2.json();
    assert(resEngine2.status === 200, 'Second reminder engine cycle executed');
    assert(engine2Json.data.upcomingCount === 0, 'No duplicate notifications sent on subsequent cron run');

    // 6. Test Grace Period Enforcement: Dose NOT Claimed Missed Prematurely
    console.log('\n[6] Testing Grace Period Enforcement (Must Not Claim Missed Prematurely)...');
    const now = new Date();
    // Create a dose that is 10 minutes past scheduled time (within 20-min grace period)
    const recentDoseTime = new Date(now.getTime() - 10 * 60 * 1000);
    const recentDose = await MedicationLog.create({
      medicationId: medId,
      elderlyUserId: seniorId,
      scheduledTimeStr: '12:00',
      scheduledAt: recentDoseTime,
      status: 'pending',
    });

    await fetch(`${BASE_URL}/notifications/trigger-engine`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${seniorToken}` },
    });

    const recentDoseCheck = await MedicationLog.findById(recentDose._id);
    assert(recentDoseCheck.status === 'pending', 'Dose remains pending during active grace period');

    const caregiverEarlyNotifs = await Notification.find({
      recipientId: nurseId,
      relatedEntityId: recentDose._id,
      type: 'missed_dose_caregiver',
    });
    assert(caregiverEarlyNotifs.length === 0, 'Caregiver NOT alerted before grace period expires');

    // 7. Test Grace Period Expiry & Caregiver Alert Dispatch
    console.log('\n[7] Testing Grace Period Expiry & Caregiver Notification...');
    // Create dose scheduled 25 minutes ago (25m > 20m grace period)
    const missedDoseTime = new Date(now.getTime() - 25 * 60 * 1000);
    const missedDose = await MedicationLog.create({
      medicationId: medId,
      elderlyUserId: seniorId,
      scheduledTimeStr: '11:00',
      scheduledAt: missedDoseTime,
      status: 'pending',
    });

    await fetch(`${BASE_URL}/notifications/trigger-engine`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${seniorToken}` },
    });

    const missedDoseCheck = await MedicationLog.findById(missedDose._id);
    assert(missedDoseCheck.status === 'missed', 'Dose status transitioned to missed after grace period');

    const caregiverAlerts = await Notification.find({
      recipientId: nurseId,
      relatedEntityId: missedDose._id,
      type: 'missed_dose_caregiver',
    });
    assert(caregiverAlerts.length === 1, 'Caregiver received exactly 1 missed dose alert');
    assert(caregiverAlerts[0].title.includes('Missed Dose Alert'), 'Alert title correctly formatted');

    // 8. Test Family Escalation
    console.log('\n[8] Testing Family Member Escalation...');
    // Create dose scheduled 50 minutes ago (grace 20m + escalation 15m = 35m trigger threshold)
    const escalatedDoseTime = new Date(now.getTime() - 50 * 60 * 1000);
    const escalatedDose = await MedicationLog.create({
      medicationId: medId,
      elderlyUserId: seniorId,
      scheduledTimeStr: '10:00',
      scheduledAt: escalatedDoseTime,
      status: 'pending',
    });

    await fetch(`${BASE_URL}/notifications/trigger-engine`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${seniorToken}` },
    });

    const familyAlerts = await Notification.find({
      recipientId: daughterId,
      relatedEntityId: escalatedDose._id,
      type: 'missed_dose_family_escalation',
    });
    assert(familyAlerts.length === 1, 'Authorized family member received urgent escalation alert');
    assert(familyAlerts[0].title.includes('URGENT ESCALATION'), 'Escalation title contains urgency tag');

    // 9. Test Notification Reading Lifecycle (Unread count, mark read, mark all read)
    console.log('\n[9] Testing Notification Reading Lifecycle & Queries...');
    const resUnread = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${nurseToken}` },
    });
    const unreadJson = await resUnread.json();
    assert(resUnread.status === 200, 'Retrieved unread notification count');
    assert(unreadJson.data.unreadCount >= 1, `Nurse has unread count: ${unreadJson.data.unreadCount}`);

    const resList = await fetch(`${BASE_URL}/notifications?limit=10`, {
      headers: { Authorization: `Bearer ${nurseToken}` },
    });
    const listJson = await resList.json();
    assert(resList.status === 200, 'Retrieved nurse notification list');
    assert(listJson.data.notifications.length >= 1, 'Notifications returned in paginated list');

    const notifId = listJson.data.notifications[0]._id;
    const resMarkOne = await fetch(`${BASE_URL}/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${nurseToken}` },
    });
    const markOneJson = await resMarkOne.json();
    assert(resMarkOne.status === 200, 'Single notification marked as read');
    assert(Boolean(markOneJson.data.readAt), 'readAt timestamp populated');

    const resMarkAll = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${nurseToken}` },
    });
    assert(resMarkAll.status === 200, 'Mark all notifications as read succeeded');

    const resAfterAll = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${nurseToken}` },
    });
    const afterAllJson = await resAfterAll.json();
    assert(afterAllJson.data.unreadCount === 0, 'Unread count is now 0 after markAll');

    console.log('\n=============================================================');
    console.log(`NOTIFICATION ENGINE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================================');

    await mongoose.disconnect();

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Notification test execution failure:', err);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
}

runNotificationEngineTests();
