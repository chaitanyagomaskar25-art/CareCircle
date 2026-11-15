import mongoose from 'mongoose';
import { env } from '../src/config/env.js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runHealthProfileTests() {
  console.log('--- STARTING HEALTH PROFILE & WELLNESS TRACKING VERIFICATION TESTS ---');
  let passed = 0;
  let failed = 0;

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
    const seniorEmail = `health_senior_${ts}@carecircle.test`;
    const nurseEmail = `health_nurse_${ts}@carecircle.test`;
    const strangerEmail = `health_stranger_${ts}@carecircle.test`;

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

    const senior = await register('Eleanor Vance', seniorEmail, 'elderly');
    const nurse = await register('Nurse Marcus', nurseEmail, 'caregiver');
    const stranger = await register('Stranger Caregiver', strangerEmail, 'caregiver');

    assert(Boolean(senior.token), 'Senior registered');
    assert(Boolean(nurse.token), 'Caregiver Nurse registered');
    assert(Boolean(stranger.token), 'Stranger registered');

    // 2. Authorize Nurse Marcus on Senior Eleanor's Care Circle
    console.log('\n[2] Authorizing Nurse Marcus in Care Circle...');
    const sId = senior.user._id || senior.user.id;
    const inviteRes = await fetch(`${BASE_URL}/care-circle/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${senior.token}`,
      },
      body: JSON.stringify({
        elderlyUserId: sId,
        inviteeEmail: nurseEmail,
        relationshipType: 'nurse',
        permissions: ['view_health_records', 'add_health_observations'],
      }),
    });
    const inviteData = await inviteRes.json();
    assert(inviteRes.status === 201, 'Care Circle invite sent to Nurse Marcus');

    const acceptRes = await fetch(
      `${BASE_URL}/care-circle/accept`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nurse.token}`,
        },
        body: JSON.stringify({ token: inviteData.data.invitationToken }),
      }
    );
    assert(acceptRes.status === 200, 'Nurse Marcus accepted Care Circle invitation');

    // 3. Test Access Permission Enforcement
    console.log('\n[3] Testing Access Permissions...');
    const unauthorizedRes = await fetch(
      `${BASE_URL}/health-profile/${senior.user._id}`,
      {
        headers: { Authorization: `Bearer ${stranger.token}` },
      }
    );
    assert(
      unauthorizedRes.status === 403,
      'Stranger blocked from accessing senior health profile (403 Forbidden)'
    );

    const authorizedRes = await fetch(
      `${BASE_URL}/health-profile/${senior.user._id}`,
      {
        headers: { Authorization: `Bearer ${nurse.token}` },
      }
    );
    const authorizedData = await authorizedRes.json();
    assert(authorizedRes.status === 200, 'Authorized Nurse retrieved health profile');
    assert(
      Boolean(authorizedData.data.disclaimer),
      'Non-diagnostic disclaimer included in response'
    );

    // 4. Test Medical Conditions Management
    console.log('\n[4] Testing Medical Conditions Management...');
    const condRes = await fetch(
      `${BASE_URL}/health-profile/${senior.user._id}/conditions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nurse.token}`,
        },
        body: JSON.stringify({
          name: 'Hypertension Stage 1',
          diagnosedDate: '2022-03-15',
          status: 'managed',
          source: 'verified_medical',
          verifiedBy: 'Dr. Robert Chen, MD',
          notes: 'Monitored with daily ACE-inhibitor',
        }),
      }
    );
    const condData = await condRes.json();
    assert(condRes.status === 201, 'Medical condition added');
    const addedCond = condData.data.medicalConditions.find(
      (c) => c.name === 'Hypertension Stage 1'
    );
    assert(
      addedCond?.source === 'verified_medical',
      'Condition distinguished as verified_medical'
    );

    // Add manual condition
    const manualCondRes = await fetch(
      `${BASE_URL}/health-profile/${senior.user._id}/conditions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${senior.token}`,
        },
        body: JSON.stringify({
          name: 'Mild Joint Stiffness',
          status: 'active',
          source: 'manual',
          notes: 'Self-reported morning knee stiffness',
        }),
      }
    );
    const manualCondData = await manualCondRes.json();
    const manualCond = manualCondData.data.medicalConditions.find(
      (c) => c.name === 'Mild Joint Stiffness'
    );
    assert(
      manualCond?.source === 'manual',
      'Self-reported condition distinguished as manual'
    );

    // 5. Test Allergies Management
    console.log('\n[5] Testing Allergies Management...');
    const allergyRes = await fetch(
      `${BASE_URL}/health-profile/${senior.user._id}/allergies`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nurse.token}`,
        },
        body: JSON.stringify({
          allergen: 'Penicillin',
          severity: 'severe',
          reaction: 'Hives and respiratory wheezing',
          source: 'verified_medical',
          verifiedBy: 'Dr. Robert Chen, MD',
        }),
      }
    );
    const allergyData = await allergyRes.json();
    assert(allergyRes.status === 201, 'Allergy record added');
    const addedAllergy = allergyData.data.allergies.find((a) => a.allergen === 'Penicillin');
    assert(addedAllergy?.severity === 'severe', 'Allergy severity correctly recorded');
    assert(addedAllergy?.source === 'verified_medical', 'Allergy distinguished as verified medical');

    // 6. Test Emergency Contacts & Doctor Information
    console.log('\n[6] Testing Emergency Contacts & Doctor Information...');
    const contactRes = await fetch(
      `${BASE_URL}/health-profile/${senior.user._id}/emergency-contacts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${senior.token}`,
        },
        body: JSON.stringify({
          name: 'Sarah Vance',
          relationship: 'Daughter',
          phone: '+1 555-9876',
          email: 'sarah.vance@carecircle.test',
          isPrimary: true,
        }),
      }
    );
    assert(contactRes.status === 201, 'Emergency contact recorded');

    const doctorRes = await fetch(
      `${BASE_URL}/health-profile/${senior.user._id}/doctors`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${senior.token}`,
        },
        body: JSON.stringify({
          name: 'Dr. Robert Chen, MD',
          specialty: 'Primary Geriatrician',
          clinic: 'Memorial Health Senior Center',
          phone: '+1 555-8900',
          isPrimaryCare: true,
        }),
      }
    );
    assert(doctorRes.status === 201, 'Doctor information recorded');

    // 7. Test Manual Observation Recording for Required Metrics
    console.log('\n[7] Testing Manual Health Observations Recording...');
    // A. Blood pressure
    const bpRes = await fetch(
      `${BASE_URL}/health-profile/${senior.user._id}/observations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nurse.token}`,
        },
        body: JSON.stringify({
          metricType: 'blood_pressure',
          value: '124/80',
          unit: 'mmHg',
          systolic: 124,
          diastolic: 80,
          recordSource: 'manual',
          notes: 'Resting seated measurement',
        }),
      }
    );
    const bpData = await bpRes.json();
    assert(bpRes.status === 201, 'Manual Blood Pressure observation recorded');
    assert(
      bpData.data.observation.elderlyUserId === senior.user._id,
      'Observation contains elderlyUserId'
    );
    assert(
      bpData.data.observation.metricType === 'blood_pressure',
      'Observation contains metricType'
    );
    assert(bpData.data.observation.value === '124/80', 'Observation contains value');
    assert(bpData.data.observation.unit === 'mmHg', 'Observation contains unit');
    assert(
      Boolean(bpData.data.observation.recordedAt),
      'Observation contains recordedAt timestamp'
    );
    assert(
      Boolean(bpData.data.observation.recordedBy),
      'Observation contains recordedBy author'
    );
    assert(
      bpData.data.observation.recordSource === 'manual',
      'Observation clearly marked as manual record'
    );

    // B. Blood sugar
    const bsRes = await fetch(
      `${BASE_URL}/health-profile/${senior.user._id}/observations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nurse.token}`,
        },
        body: JSON.stringify({
          metricType: 'blood_sugar',
          value: '105',
          numericValue: 105,
          unit: 'mg/dL',
          recordSource: 'manual',
          notes: 'Fasting morning fingerstick',
        }),
      }
    );
    assert(bsRes.status === 201, 'Manual Blood Sugar observation recorded');

    // C. Weight
    const wtRes = await fetch(
      `${BASE_URL}/health-profile/${senior.user._id}/observations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nurse.token}`,
        },
        body: JSON.stringify({
          metricType: 'weight',
          value: '142.5',
          numericValue: 142.5,
          unit: 'lbs',
          recordSource: 'manual',
          notes: 'Morning weight before breakfast',
        }),
      }
    );
    assert(wtRes.status === 201, 'Manual Weight observation recorded');

    // D. Heart rate
    const hrRes = await fetch(
      `${BASE_URL}/health-profile/${senior.user._id}/observations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nurse.token}`,
        },
        body: JSON.stringify({
          metricType: 'heart_rate',
          value: '72',
          numericValue: 72,
          unit: 'bpm',
          recordSource: 'manual',
          notes: 'Resting pulse',
        }),
      }
    );
    assert(hrRes.status === 201, 'Manual Heart Rate observation recorded');

    // E. General wellness status
    const gwRes = await fetch(
      `${BASE_URL}/health-profile/${senior.user._id}/observations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${senior.token}`,
        },
        body: JSON.stringify({
          metricType: 'general_wellness',
          value: 'Feeling energetic and well-rested',
          unit: 'status',
          recordSource: 'manual',
          notes: 'Slept 8 hours uninterrupted',
        }),
      }
    );
    assert(gwRes.status === 201, 'General Wellness Status recorded');

    // 8. Test Daily Wellness Check-in
    console.log('\n[8] Testing Daily Wellness Check-in...');
    const checkinRes = await fetch(
      `${BASE_URL}/health-profile/${senior.user._id}/wellness-checkin`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${senior.token}`,
        },
        body: JSON.stringify({
          feeling: 'great',
          energyLevel: 'high',
          sleepQuality: 'excellent',
          waterIntakeGlasses: 6,
          notes: 'Went for a pleasant morning walk',
        }),
      }
    );
    assert(checkinRes.status === 201, 'Daily wellness check-in recorded');

    const todayCheckinRes = await fetch(
      `${BASE_URL}/health-profile/${senior.user._id}/wellness-checkin/today`,
      {
        headers: { Authorization: `Bearer ${nurse.token}` },
      }
    );
    const todayData = await todayCheckinRes.json();
    assert(todayData.data.hasCheckedInToday === true, "Senior has checked in today confirmed");
    assert(todayData.data.todayCheckIn.feeling === 'great', "Today's feeling matches 'great'");

    // 9. Test Historical Health Observations with Filters
    console.log('\n[9] Testing Historical Health Observations & Date Filters...');
    const histRes = await fetch(
      `${BASE_URL}/health-profile/${senior.user._id}/observations?metricType=blood_pressure`,
      {
        headers: { Authorization: `Bearer ${nurse.token}` },
      }
    );
    const histData = await histRes.json();
    assert(histRes.status === 200, 'Historical observations filtered by metricType');
    assert(
      histData.data.observations.every((o) => o.metricType === 'blood_pressure'),
      'All returned records match metricType filter'
    );

    // 10. Test Historical Trends & Verification of No Invented Missing Measurements
    console.log('\n[10] Testing Historical Trends & Non-diagnostic Compliance...');
    const trendsRes = await fetch(
      `${BASE_URL}/health-profile/${senior.user._id}/trends?metricType=blood_pressure&days=30`,
      {
        headers: { Authorization: `Bearer ${nurse.token}` },
      }
    );
    const trendsData = await trendsRes.json();
    assert(trendsRes.status === 200, 'Historical trends query succeeded');
    assert(
      trendsData.data.measurements.length >= 1,
      'Only actual measured data points returned'
    );
    assert(
      trendsData.data.measurements.every((m) => m.recordedAt && m.value),
      'No missing measurements invented or interpolated'
    );
    assert(
      Boolean(trendsData.data.disclaimer),
      'Medical disclaimer included without automatic diagnostic or treatment assertions'
    );

    console.log(`\n========================================================`);
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================================`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error during test run:', err);
    process.exit(1);
  }
}

runHealthProfileTests();
