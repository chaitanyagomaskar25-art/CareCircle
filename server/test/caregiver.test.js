import mongoose from 'mongoose';
import { env } from '../src/config/env.js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runCaregiverDashboardTests() {
  console.log('--- STARTING CAREGIVER DASHBOARD & RESIDENT OVERVIEW VERIFICATION TESTS ---');
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
    const senior1Email = `cg_senior1_${ts}@carecircle.test`;
    const senior2Email = `cg_senior2_${ts}@carecircle.test`;
    const nurseEmail = `cg_nurse_${ts}@carecircle.test`;
    const strangerNurseEmail = `cg_stranger_${ts}@carecircle.test`;

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
          phone: '+1 555-1234',
          role,
        }),
      });
      const data = await res.json();
      return { token: data.data.token, user: data.data.user };
    };

    const senior1 = await register('Grandma Eleanor', senior1Email, 'elderly');
    const senior2 = await register('Grandpa Arthur', senior2Email, 'elderly');
    const nurse = await register('Nurse Marcus, RN', nurseEmail, 'caregiver');
    const strangerNurse = await register('Stranger Nurse, LPN', strangerNurseEmail, 'caregiver');

    assert(Boolean(senior1.token), 'Senior 1 (Eleanor) registered');
    assert(Boolean(senior2.token), 'Senior 2 (Arthur) registered');
    assert(Boolean(nurse.token), 'Primary Nurse Marcus registered');
    assert(Boolean(strangerNurse.token), 'Stranger Nurse registered');

    // 2. Authorize Nurse Marcus ONLY for Senior 1 (Eleanor)
    console.log('\n[2] Authorizing Nurse Marcus ONLY for Senior Eleanor...');
    const invRes = await fetch(`${BASE_URL}/care-circle/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${senior1.token}`,
      },
      body: JSON.stringify({
        elderlyUserId: senior1.user._id,
        inviteeEmail: nurseEmail,
        relationshipType: 'nurse',
        permissions: [
          'view_medications',
          'manage_medications',
          'view_appointments',
          'manage_appointments',
          'view_health_records',
          'add_health_observations',
        ],
      }),
    });
    const invJson = await invRes.json();
    assert(invRes.status === 201, 'Senior Eleanor invited Nurse Marcus');

    const acceptRes = await fetch(`${BASE_URL}/care-circle/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurse.token}`,
      },
      body: JSON.stringify({ token: invJson.data.invitationToken }),
    });
    assert(acceptRes.status === 200, 'Nurse Marcus accepted Eleanor invitation');

    // 3. Test Privacy & Isolation: Stranger Nurse sees NO residents
    console.log('\n[3] Testing Data Isolation: Stranger Caregiver Overview...');
    const resStrangerOverview = await fetch(`${BASE_URL}/caregiver/overview`, {
      headers: { Authorization: `Bearer ${strangerNurse.token}` },
    });
    const strangerOverviewJson = await resStrangerOverview.json();
    assert(resStrangerOverview.status === 200, 'Stranger caregiver overview returns 200');
    assert(strangerOverviewJson.data.assignedResidents.length === 0, 'Stranger caregiver has 0 assigned residents');
    assert(strangerOverviewJson.data.metrics.totalResidents === 0, 'Metrics reflect 0 residents for unauthorized nurse');

    // 4. Test Authorized Nurse Dashboard Overview
    console.log('\n[4] Testing Authorized Nurse Dashboard Overview...');
    const resNurseOverview = await fetch(`${BASE_URL}/caregiver/overview`, {
      headers: { Authorization: `Bearer ${nurse.token}` },
    });
    const nurseOverviewJson = await resNurseOverview.json();
    if (resNurseOverview.status !== 200) {
      console.error('[DEBUG Caregiver Overview Error]:', resNurseOverview.status, nurseOverviewJson);
    }
    assert(resNurseOverview.status === 200, 'Nurse overview returns 200 OK');
    assert(nurseOverviewJson.data.assignedResidents.length === 1, 'Nurse Marcus sees exactly 1 authorized resident');
    assert(nurseOverviewJson.data.assignedResidents[0].name === 'Grandma Eleanor', 'Authorized resident is Grandma Eleanor');
    assert(
      !nurseOverviewJson.data.assignedResidents.some((r) => r.name === 'Grandpa Arthur'),
      'Grandpa Arthur is completely omitted (no unauthorized data leakage)'
    );

    // 5. Test Recording Clinical Data: Observations, Notes, Appointments
    console.log('\n[5] Testing Clinical Observations, Notes, and Appointments Creation...');
    const resObs = await fetch(`${BASE_URL}/caregiver/elderly/${senior1.user._id}/observations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurse.token}`,
      },
      body: JSON.stringify({
        type: 'blood_pressure',
        title: 'Morning Blood Pressure Check',
        value: '124/82',
        numericValue: 124,
        unit: 'mmHg',
        severity: 'normal',
        notes: 'Sitting calmly, pulse 72 regular',
      }),
    });
    const obsJson = await resObs.json();
    if (resObs.status !== 201) {
      console.error('[DEBUG Observation Error]:', resObs.status, obsJson);
    }
    assert(resObs.status === 201, 'Recorded clinical blood pressure observation');
    assert(obsJson.data.value === '124/82', 'Observation value preserved');

    const resNote = await fetch(`${BASE_URL}/caregiver/elderly/${senior1.user._id}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurse.token}`,
      },
      body: JSON.stringify({
        category: 'medical',
        note: 'Eleanor walked 15 minutes in garden after breakfast with excellent gait stability.',
        isPriority: false,
      }),
    });
    const noteJson = await resNote.json();
    assert(resNote.status === 201, 'Recorded care note');

    const resAppt = await fetch(`${BASE_URL}/caregiver/elderly/${senior1.user._id}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurse.token}`,
      },
      body: JSON.stringify({
        doctorName: 'Dr. Robert Chen, MD',
        specialty: 'Cardiology & Geriatrics',
        clinicName: 'Senior Wellness Center',
        appointmentDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        timeStr: '02:30 PM',
        type: 'checkup',
        phone: '+1 555-890-1234',
        notes: 'Follow-up on Lisinopril medication tolerance',
      }),
    });
    assert(resAppt.status === 201, 'Scheduled upcoming doctor appointment');

    // 6. Test Unauthorized Access Rejection on Individual Senior Overview
    console.log('\n[6] Testing Unauthorized Access Rejection on Individual Detail Page...');
    const resStrangerDetail = await fetch(`${BASE_URL}/caregiver/elderly/${senior1.user._id}`, {
      headers: { Authorization: `Bearer ${strangerNurse.token}` },
    });
    assert(resStrangerDetail.status === 403, 'Stranger nurse blocked with 403 from accessing Eleanor care details');

    // 7. Test Authorized Detailed Individual Care Overview
    console.log('\n[7] Testing Authorized Detailed Individual Care Overview...');
    const resNurseDetail = await fetch(`${BASE_URL}/caregiver/elderly/${senior1.user._id}`, {
      headers: { Authorization: `Bearer ${nurse.token}` },
    });
    const detailJson = await resNurseDetail.json();
    assert(resNurseDetail.status === 200, 'Authorized nurse accesses Eleanor detailed care overview');
    assert(detailJson.data.resident.name === 'Grandma Eleanor', 'Resident personal profile populated');
    assert(Array.isArray(detailJson.data.careCircleMembers), 'Care Circle members contact list returned');
    assert(Array.isArray(detailJson.data.todaySchedule), 'Today medication schedule returned');
    assert(Array.isArray(detailJson.data.observations), 'Health observations returned');
    assert(detailJson.data.observations.length >= 1, 'Includes newly recorded BP observation');
    assert(Array.isArray(detailJson.data.appointments), 'Appointments list returned');
    assert(detailJson.data.appointments.length >= 1, 'Includes newly scheduled cardiology appointment');
    assert(Array.isArray(detailJson.data.careNotes), 'Care notes returned');

    // 8. Test History Filtering by Status
    console.log('\n[8] Testing Caregiver Medication History Filtering...');
    const resFilterPending = await fetch(
      `${BASE_URL}/caregiver/elderly/${senior1.user._id}?status=pending`,
      { headers: { Authorization: `Bearer ${nurse.token}` } }
    );
    const filterPendingJson = await resFilterPending.json();
    assert(resFilterPending.status === 200, 'Filtered history by status=pending returned 200');

    console.log('\n=============================================================');
    console.log(`CAREGIVER DASHBOARD RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================================');

    await mongoose.disconnect();
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Caregiver test execution error:', err);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
}

runCaregiverDashboardTests();
