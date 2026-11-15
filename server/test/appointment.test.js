import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { Medication } from '../src/models/medication.model.js';
import { HealthObservation } from '../src/models/healthObservation.model.js';
import { Appointment } from '../src/models/appointment.model.js';
import { Notification } from '../src/models/notification.model.js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runAppointmentTests() {
  console.log('--- STARTING DOCTOR APPOINTMENT MANAGEMENT TEST SUITE ---');
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
    const seniorEmail = `appt_senior_${ts}@carecircle.test`;
    const nurseEmail = `appt_nurse_${ts}@carecircle.test`;
    const viewOnlyEmail = `appt_daughter_${ts}@carecircle.test`;
    const strangerEmail = `appt_stranger_${ts}@carecircle.test`;

    // 1. Account Setup
    console.log('\n[1] Registering Test Accounts...');
    const register = async (name, email, role) => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password: 'Password123!',
          phone: '+1 555-7788',
          role,
        }),
      });
      const data = await res.json();
      return { token: data.data.token, user: data.data.user };
    };

    const senior = await register('Grandma Eleanor', seniorEmail, 'elderly');
    const nurse = await register('Nurse Marcus, RN', nurseEmail, 'caregiver');
    const daughter = await register('Sarah Daughter', viewOnlyEmail, 'family');
    const stranger = await register('Stranger Bob', strangerEmail, 'caregiver');

    const sId = senior.user._id || senior.user.id;

    assert(Boolean(senior.token), 'Senior Eleanor registered');
    assert(Boolean(nurse.token), 'Nurse Marcus registered');
    assert(Boolean(daughter.token), 'Daughter Sarah registered');
    assert(Boolean(stranger.token), 'Stranger Bob registered');

    // 2. Authorize Nurse with manage_appointments, Daughter with view_appointments ONLY
    console.log('\n[2] Setting Up CareCircle Relationship Permissions...');
    // Nurse: manage_appointments
    const nurseInv = await fetch(`${BASE_URL}/care-circle/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${senior.token}`,
      },
      body: JSON.stringify({
        elderlyUserId: sId,
        inviteeEmail: nurseEmail,
        relationshipType: 'nurse',
        permissions: ['view_appointments', 'manage_appointments', 'view_medications'],
      }),
    });
    const nurseInvData = await nurseInv.json();

    await fetch(`${BASE_URL}/care-circle/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurse.token}`,
      },
      body: JSON.stringify({ token: nurseInvData.data.invitationToken }),
    });

    // Daughter: view_appointments ONLY
    const daughterInv = await fetch(`${BASE_URL}/care-circle/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${senior.token}`,
      },
      body: JSON.stringify({
        elderlyUserId: sId,
        inviteeEmail: viewOnlyEmail,
        relationshipType: 'daughter',
        permissions: ['view_appointments'],
      }),
    });
    const daughterInvData = await daughterInv.json();

    await fetch(`${BASE_URL}/care-circle/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${daughter.token}`,
      },
      body: JSON.stringify({ token: daughterInvData.data.invitationToken }),
    });

    assert(true, 'Nurse accepted with manage_appointments permission');
    assert(true, 'Daughter accepted with view_appointments (view-only) permission');

    // 3. Testing Timezone & Adding Appointment
    console.log('\n[3] Testing Timezone Handling & Appointment Creation...');
    const apptDateUTC = new Date(Date.now() + 48 * 3600 * 1000); // 2 days ahead
    apptDateUTC.setMinutes(0, 0, 0);

    const createRes = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurse.token}`,
      },
      body: JSON.stringify({
        elderlyUserId: sId,
        doctorName: 'Dr. Emily Watson',
        specialty: 'Neurology',
        hospitalName: 'St. Jude Memory Care Hospital',
        location: 'Suite 402, North Pavilion',
        appointmentDate: apptDateUTC.toISOString(),
        appointmentTime: '10:00 AM',
        durationMinutes: 45,
        reason: 'Cognitive assessment & Donepezil titration evaluation',
        notes: 'Bring current medication list and reading glasses',
        isTelehealth: false,
      }),
    });

    const createData = await createRes.json();
    assert(createRes.status === 201, 'Appointment created with 201 Created');
    assert(createData.data.doctorName === 'Dr. Emily Watson', 'Doctor name stored correctly');
    assert(createData.data.hospitalName === 'St. Jude Memory Care Hospital', 'Hospital name stored');
    assert(createData.data.durationMinutes === 45, 'Duration set to 45 minutes');
    const appointmentId = createData.data._id;

    // 4. Testing Conflict Detection
    console.log('\n[4] Testing Appointment Conflict Detection...');
    // Attempt to schedule an overlapping appointment for the same senior (15 minutes after start)
    const conflictingDate = new Date(apptDateUTC.getTime() + 15 * 60 * 1000);

    const conflictRes = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurse.token}`,
      },
      body: JSON.stringify({
        elderlyUserId: sId,
        doctorName: 'Dr. John Smith',
        specialty: 'Cardiology',
        hospitalName: 'City Heart Clinic',
        appointmentDate: conflictingDate.toISOString(),
        appointmentTime: '10:15 AM',
        durationMinutes: 30,
        reason: 'Routine ECG',
      }),
    });

    const conflictData = await conflictRes.json();
    assert(conflictRes.status === 409, 'Overlapping appointment blocked with 409 Conflict');
    assert(
      conflictData.message.includes('Appointment conflict'),
      'Conflict error message clearly identifies overlapping booking'
    );

    // Non-conflicting appointment 3 hours later should succeed
    const nonConflictingDate = new Date(apptDateUTC.getTime() + 3 * 60 * 60 * 1000);
    const nonConflictRes = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurse.token}`,
      },
      body: JSON.stringify({
        elderlyUserId: sId,
        doctorName: 'Dr. John Smith',
        specialty: 'Cardiology',
        hospitalName: 'City Heart Clinic',
        appointmentDate: nonConflictingDate.toISOString(),
        appointmentTime: '01:00 PM',
        durationMinutes: 30,
        reason: 'Routine ECG',
      }),
    });
    assert(nonConflictRes.status === 201, 'Non-conflicting appointment created successfully');

    // 5. Testing Permission Enforcement (View-Only vs Unauthorized)
    console.log('\n[5] Testing Permission Enforcement on Mutation APIs...');
    // View-only daughter attempts to create appointment -> should fail 403
    const daughterCreateRes = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${daughter.token}`,
      },
      body: JSON.stringify({
        elderlyUserId: sId,
        doctorName: 'Dr. Rogue',
        appointmentDate: new Date().toISOString(),
      }),
    });
    assert(daughterCreateRes.status === 403, 'View-only family member blocked from creating appointment (403)');

    // Stranger attempts to view appointments -> should fail 403
    const strangerGetRes = await fetch(`${BASE_URL}/appointments?elderlyUserId=${sId}`, {
      headers: { Authorization: `Bearer ${stranger.token}` },
    });
    assert(strangerGetRes.status === 403, 'Stranger blocked from viewing senior appointments (403)');

    // Authorized daughter CAN view appointments
    const daughterGetRes = await fetch(`${BASE_URL}/appointments?elderlyUserId=${sId}&status=upcoming`, {
      headers: { Authorization: `Bearer ${daughter.token}` },
    });
    const daughterGetData = await daughterGetRes.json();
    assert(daughterGetRes.status === 200, 'Authorized daughter can retrieve appointments (200)');
    assert(daughterGetData.data.length >= 2, 'Retrieved upcoming appointments list');

    // 6. Testing Edit Appointment API
    console.log('\n[6] Testing Edit Appointment API...');
    const editRes = await fetch(`${BASE_URL}/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurse.token}`,
      },
      body: JSON.stringify({
        location: 'Suite 410, Memory Care Wing',
        isTelehealth: true,
        telehealthLink: 'https://telehealth.carecircle.test/room-watson',
      }),
    });
    const editData = await editRes.json();
    assert(editRes.status === 200, 'Appointment updated with 200 OK');
    assert(editData.data.isTelehealth === true, 'Telehealth mode updated');
    assert(editData.data.location === 'Suite 410, Memory Care Wing', 'Location updated');

    // 7. Testing Family Questions for Doctor
    console.log('\n[7] Testing Family Questions for Doctor...');
    const questionRes = await fetch(`${BASE_URL}/appointments/${appointmentId}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${daughter.token}`,
      },
      body: JSON.stringify({
        question: 'Has Eleanor shown any signs of daytime grogginess after the evening dose?',
      }),
    });
    const questionData = await questionRes.json();
    assert(questionRes.status === 200, 'Family question added to appointment (200)');
    assert(
      questionData.data.questionsForDoctor.length >= 1,
      'questionsForDoctor array populated'
    );
    assert(
      questionData.data.questionsForDoctor[0].question.includes('daytime grogginess'),
      'Question text recorded accurately'
    );

    // 8. Testing Preparation Summary Generation
    console.log('\n[8] Testing Doctor Visit Preparation Summary...');
    // Seed active prescription
    await Medication.create({
      elderlyUserId: sId,
      medicineName: 'Donepezil',
      dosage: '10mg',
      instructions: 'Take 1 tablet at bedtime',
      frequency: 'daily',
      scheduledTimes: ['21:00'],
      status: 'active',
      startDate: new Date(),
      createdBy: sId,
    });

    // Seed health observation
    await HealthObservation.create({
      elderlyUserId: sId,
      recordedBy: senior.user.id || sId,
      type: 'blood_pressure',
      title: 'Blood Pressure',
      value: '120/80',
      unit: 'mmHg',
      severity: 'normal',
      recordedAt: new Date(),
    });

    const prepRes = await fetch(`${BASE_URL}/appointments/${appointmentId}/preparation-summary`, {
      headers: { Authorization: `Bearer ${nurse.token}` },
    });
    const prepData = await prepRes.json();
    assert(prepRes.status === 200, 'Preparation summary generated with 200 OK');
    assert(Boolean(prepData.data.appointment), 'Appointment section included in summary');
    assert(Boolean(prepData.data.resident), 'Resident profile included in summary');
    assert(prepData.data.activeMedications.length >= 1, 'Active medications listed in summary');
    assert(prepData.data.recentObservations.length >= 1, 'Recent health observations listed in summary');
    assert(prepData.data.appointment.questionsForDoctor.length >= 1, 'Family questions included in summary');

    // 9. Testing Reminder Scheduling (24h and 2h Reminders)
    console.log('\n[9] Testing Appointment Reminder Engine...');
    // Create an appointment within the 24-hour reminder window
    const soonDate = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now
    const soonAppt = await Appointment.create({
      elderlyUserId: sId,
      doctorName: 'Dr. Sarah Geriatrician',
      specialty: 'Geriatrics',
      clinicName: 'St. Jude Geriatric Center',
      appointmentDate: soonDate,
      timeStr: '02:00 PM',
      durationMinutes: 45,
      status: 'upcoming',
      reminderSent24h: false,
      reminderSent2h: false,
    });

    const triggerRes = await fetch(`${BASE_URL}/appointments/trigger-reminders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${nurse.token}` },
    });
    const triggerData = await triggerRes.json();
    assert(triggerRes.status === 200, 'Reminder trigger API executed (200)');

    const updatedSoon = await Appointment.findById(soonAppt._id);
    assert(updatedSoon.reminderSent24h === true, 'Appointment marked reminderSent24h: true');

    // Verify notification was created
    const reminderNotifs = await Notification.find({
      type: 'appointment_reminder',
      relatedEntityId: soonAppt._id,
    });
    assert(reminderNotifs.length >= 1, 'Appointment reminder notification dispatched');
    assert(
      reminderNotifs[0].title.includes('Dr. Sarah Geriatrician'),
      'Reminder title contains doctor name'
    );

    // 10. Testing Idempotent Reminders (No duplicate notification on subsequent trigger)
    console.log('\n[10] Testing Idempotent Reminder Scheduling (No Duplicates)...');
    const initialCount = reminderNotifs.length;
    await fetch(`${BASE_URL}/appointments/trigger-reminders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${nurse.token}` },
    });
    const afterCount = await Notification.countDocuments({
      type: 'appointment_reminder',
      relatedEntityId: soonAppt._id,
    });
    assert(afterCount === initialCount, 'Subsequent reminder cycle did not send duplicate notifications');

    // 11. Testing Cancel Appointment API
    console.log('\n[11] Testing Cancel Appointment API...');
    const cancelRes = await fetch(`${BASE_URL}/appointments/${appointmentId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurse.token}`,
      },
      body: JSON.stringify({ reason: 'Patient feeling unwell, will reschedule' }),
    });
    const cancelData = await cancelRes.json();
    assert(cancelRes.status === 200, 'Appointment cancelled with 200 OK');
    assert(cancelData.data.status === 'cancelled', 'Appointment status transitioned to cancelled');
    assert(cancelData.data.notes.includes('Patient feeling unwell'), 'Cancellation reason noted');
  } catch (err) {
    console.error('Test execution failed with error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
  }

  console.log('\n=============================================================');
  console.log(`APPOINTMENT MANAGEMENT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAppointmentTests();
