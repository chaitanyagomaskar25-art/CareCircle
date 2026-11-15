import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { Medication } from '../src/models/medication.model.js';
import { MedicationLog } from '../src/models/medicationLog.model.js';
import { Appointment } from '../src/models/appointment.model.js';
import { HealthObservation } from '../src/models/healthObservation.model.js';
import { CareNote } from '../src/models/careNote.model.js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runFamilyDashboardTests() {
  console.log('--- STARTING FAMILY MEMBER DASHBOARD & ACTIVITY FEED VERIFICATION TESTS ---');
  let passed = 0;
  let failed = 0;

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
    const senior1Email = `fam_senior1_${ts}@carecircle.test`;
    const senior2Email = `fam_senior2_${ts}@carecircle.test`;
    const familyEmail = `fam_daughter_${ts}@carecircle.test`;
    const strangerFamilyEmail = `fam_stranger_${ts}@carecircle.test`;

    // 1. Setup Accounts
    console.log('\n[1] Registering Test Accounts...');
    const register = async (name, email, role) => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password: 'Password123!',
          phone: '+1 555-4321',
          role,
        }),
      });
      const data = await res.json();
      return { token: data.data.token, user: data.data.user };
    };

    const senior1 = await register('Grandma Eleanor', senior1Email, 'elderly');
    const senior2 = await register('Grandpa Arthur', senior2Email, 'elderly');
    const familyDaughter = await register('Sarah Jenkins', familyEmail, 'family');
    const strangerFamily = await register('Stranger Person', strangerFamilyEmail, 'family');

    assert(Boolean(senior1.token), 'Senior 1 (Eleanor) registered successfully');
    assert(Boolean(senior2.token), 'Senior 2 (Arthur) registered successfully');
    assert(Boolean(familyDaughter.token), 'Family Member (Sarah) registered successfully');
    assert(Boolean(strangerFamily.token), 'Stranger Family Member registered successfully');

    // 2. Authorize Sarah ONLY for Eleanor with view permissions
    console.log('\n[2] Authorizing Daughter Sarah ONLY for Senior Eleanor...');
    const invRes = await fetch(`${BASE_URL}/care-circle/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${senior1.token}`,
      },
      body: JSON.stringify({
        elderlyUserId: senior1.user._id,
        inviteeEmail: familyEmail,
        relationshipType: 'daughter',
        permissions: ['view_medications', 'view_appointments', 'view_health_records'],
      }),
    });
    const invData = await invRes.json();
    assert(invRes.status === 201, 'Invitation created for daughter Sarah');

    const acceptRes = await fetch(`${BASE_URL}/care-circle/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${familyDaughter.token}`,
      },
      body: JSON.stringify({
        token: invData.data.invitationToken,
      }),
    });
    assert(acceptRes.status === 200, 'Daughter Sarah accepted Eleanor invitation');

    // 3. Test Data Isolation (Stranger receives 0 seniors)
    console.log('\n[3] Testing Data Isolation: Stranger Family Member Overview...');
    const strangerRes = await fetch(`${BASE_URL}/family/dashboard`, {
      headers: { Authorization: `Bearer ${strangerFamily.token}` },
    });
    const strangerData = await strangerRes.json();
    assert(strangerRes.status === 200, 'Stranger family dashboard returns 200');
    assert(strangerData.data.authorizedResidents.length === 0, 'Stranger has 0 authorized seniors');
    assert(strangerData.data.metrics.totalSupportedSeniors === 0, 'Stranger metrics reflect 0 supported seniors');

    // 4. Test Authorized Family Dashboard Overview
    console.log('\n[4] Testing Authorized Family Member Dashboard Overview...');
    const sarahRes = await fetch(`${BASE_URL}/family/dashboard`, {
      headers: { Authorization: `Bearer ${familyDaughter.token}` },
    });
    const sarahData = await sarahRes.json();
    assert(sarahRes.status === 200, 'Sarah family dashboard returns 200 OK');
    assert(sarahData.data.authorizedResidents.length === 1, 'Sarah sees exactly 1 authorized senior');
    assert(sarahData.data.authorizedResidents[0].name === 'Grandma Eleanor', 'Authorized senior is Eleanor');
    assert(sarahData.data.authorizedResidents[0].relationshipType === 'daughter', 'Relationship is daughter');

    // 5. Test Permission-Aware UI Properties
    console.log('\n[5] Testing Permission-Aware Flags for View-Only Family Member...');
    const perms = sarahData.data.authorizedResidents[0].permissions;
    assert(perms.viewMedications === true, 'viewMedications is true');
    assert(perms.manageMedications === false, 'manageMedications is false (view-only)');
    assert(perms.viewAppointments === true, 'viewAppointments is true');
    assert(perms.manageAppointments === false, 'manageAppointments is false (view-only)');
    assert(perms.viewHealthRecords === true, 'viewHealthRecords is true');
    assert(perms.addHealthObservations === false, 'addHealthObservations is false');

    // 6. Seed Clinical and Care Events (Doses, Vitals, Notes, Appointments)
    console.log('\n[6] Seeding Doses, Appointments, Vitals, and Caregiver Notes...');
    const s1Id = senior1.user._id || senior1.user.id;
    const s2Id = senior2.user._id || senior2.user.id;

    // A. Medication Prescription & Doses
    const med = await Medication.create({
      elderlyUserId: s1Id,
      medicineName: 'Donepezil',
      dosage: '10mg',
      instructions: 'Take 1 tablet at bedtime for memory support',
      frequency: 'daily',
      scheduledTimes: ['21:00'],
      startDate: new Date(),
      status: 'active',
      createdBy: s1Id,
    });

    const confirmedDose = await MedicationLog.create({
      medicationId: med._id,
      elderlyUserId: s1Id,
      scheduledAt: new Date(Date.now() - 3600 * 1000),
      scheduledTimeStr: '21:00',
      status: 'taken',
      confirmedAt: new Date(),
      confirmedBy: s1Id,
      notes: 'Taken with a glass of water',
    });

    const missedDose = await MedicationLog.create({
      medicationId: med._id,
      elderlyUserId: s1Id,
      scheduledAt: new Date(Date.now() - 2 * 3600 * 1000),
      scheduledTimeStr: '09:00',
      status: 'missed',
      notes: 'Resident was resting',
    });

    // B. Appointment
    const appt = await Appointment.create({
      elderlyUserId: s1Id,
      doctorName: 'Dr. Emily Watson',
      specialty: 'Neurology',
      clinicName: 'St. Jude Memory Care Clinic',
      appointmentDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      timeStr: '11:00 AM',
      type: 'specialist',
      status: 'upcoming',
      isTelehealth: true,
      telehealthLink: 'https://telehealth.carecircle.test/room-watson',
    });

    // C. Health Observation
    const obs = await HealthObservation.create({
      elderlyUserId: s1Id,
      recordedBy: s1Id,
      type: 'blood_pressure',
      title: 'Blood Pressure',
      value: '118/76',
      unit: 'mmHg',
      severity: 'normal',
      notes: 'Resting BP within optimal geriatric range',
    });

    // D. Care Note
    const note = await CareNote.create({
      elderlyUserId: s1Id,
      authorId: s1Id,
      category: 'general',
      note: 'Eleanor enjoyed painting watercolors in the courtyard today. Bright mood and good appetite.',
      isPriority: false,
    });

    assert(Boolean(confirmedDose._id), 'Confirmed medication dose seeded');
    assert(Boolean(missedDose._id), 'Missed medication dose seeded');
    assert(Boolean(appt._id), 'Upcoming neurology appointment seeded');
    assert(Boolean(obs._id), 'Health observation (BP) seeded');
    assert(Boolean(note._id), 'Caregiver note seeded');

    // 7. Testing Missed-Dose Alerts & Reassurance Context
    console.log('\n[7] Testing Missed-Dose Alerts & Reassurance in Dashboard...');
    const updatedDashboardRes = await fetch(`${BASE_URL}/family/dashboard`, {
      headers: { Authorization: `Bearer ${familyDaughter.token}` },
    });
    const updatedDashboard = await updatedDashboardRes.json();
    assert(updatedDashboardRes.status === 200, 'Dashboard retrieved with seeded items');
    assert(updatedDashboard.data.missedDoseAlerts.length >= 1, 'Missed dose alert returned in dashboard');
    const alertItem = updatedDashboard.data.missedDoseAlerts[0];
    assert(alertItem.status === 'missed', 'Alert status is missed');
    assert(Boolean(alertItem.reassuranceNote), 'Alert contains reassuring care context note');

    // 8. Testing Unified Family Activity Feed
    console.log('\n[8] Testing Unified Family Activity Feed API...');
    const feedRes = await fetch(`${BASE_URL}/family/activity-feed`, {
      headers: { Authorization: `Bearer ${familyDaughter.token}` },
    });
    const feedData = await feedRes.json();
    assert(feedRes.status === 200, 'Activity feed returns 200 OK');
    const items = feedData.data;
    assert(items.length >= 4, `Activity feed populated (count: ${items.length})`);

    const hasMedConfirmed = items.some((i) => i.type === 'medication_confirmed');
    const hasMedMissed = items.some((i) => i.type === 'medication_missed');
    const hasAppt = items.some((i) => i.type === 'appointment_scheduled');
    const hasObs = items.some((i) => i.type === 'health_observation_recorded');
    const hasNote = items.some((i) => i.type === 'caregiver_note_added');

    assert(hasMedConfirmed, 'Feed includes medication_confirmed event');
    assert(hasMedMissed, 'Feed includes medication_missed event');
    assert(hasAppt, 'Feed includes appointment_scheduled event');
    assert(hasObs, 'Feed includes health_observation_recorded event');
    assert(hasNote, 'Feed includes caregiver_note_added event');

    // 9. Testing Feed Category & Date Range Filtering
    console.log('\n[9] Testing Activity Feed Filtering...');
    const medOnlyRes = await fetch(`${BASE_URL}/family/activity-feed?category=medications`, {
      headers: { Authorization: `Bearer ${familyDaughter.token}` },
    });
    const medOnlyData = await medOnlyRes.json();
    const allAreMeds = medOnlyData.data.every((i) => i.category === 'medications');
    assert(allAreMeds, 'Category filter "medications" only returns medication events');

    const apptOnlyRes = await fetch(`${BASE_URL}/family/activity-feed?category=appointments`, {
      headers: { Authorization: `Bearer ${familyDaughter.token}` },
    });
    const apptOnlyData = await apptOnlyRes.json();
    const allAreAppts = apptOnlyData.data.every((i) => i.category === 'appointments');
    assert(allAreAppts, 'Category filter "appointments" only returns appointment events');

    // 10. Testing Detailed Single Resident Profile for Family
    console.log('\n[10] Testing Single Resident Profile for Family Member...');
    const detailRes = await fetch(`${BASE_URL}/family/resident/${s1Id}`, {
      headers: { Authorization: `Bearer ${familyDaughter.token}` },
    });
    const detailData = await detailRes.json();
    assert(detailRes.status === 200, 'Resident detail returns 200 OK');
    assert(detailData.data.elderly.name === 'Grandma Eleanor', 'Resident detail matches Eleanor');
    assert(detailData.data.todayDoses.length >= 1, 'Today doses included');
    assert(detailData.data.appointments.length >= 1, 'Appointments included');
    assert(detailData.data.observations.length >= 1, 'Observations included');

    // 11. Testing Unauthorized Resident Profile Access Blocked
    console.log('\n[11] Testing Unauthorized Resident Profile Access Blocked (403)...');
    const unauthorizedDetailRes = await fetch(`${BASE_URL}/family/resident/${s2Id}`, {
      headers: { Authorization: `Bearer ${familyDaughter.token}` },
    });
    assert(
      unauthorizedDetailRes.status === 403,
      'Sarah blocked with 403 Forbidden when trying to access Arthur profile'
    );
  } catch (error) {
    console.error('Test execution failed with error:', error);
    failed++;
  } finally {
    await mongoose.disconnect();
  }

  console.log('\n=============================================================');
  console.log(`FAMILY DASHBOARD RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runFamilyDashboardTests();
