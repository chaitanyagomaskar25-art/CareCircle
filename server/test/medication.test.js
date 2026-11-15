const BASE_AUTH = 'http://localhost:5000/api/v1/auth';
const BASE_CIRCLE = 'http://localhost:5000/api/v1/care-circle';
const BASE_MEDS = 'http://localhost:5000/api/v1/medications';

async function runMedicationTests() {
  console.log('--- STARTING MEDICATION MANAGEMENT & DOSE VERIFICATION TESTS ---');
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
    const seniorEmail = `med_eleanor_${ts}@carecircle.test`;
    const caregiverEmail = `med_nurse_${ts}@carecircle.test`;
    const strangerEmail = `med_stranger_${ts}@carecircle.test`;

    // 1. Setup Accounts
    console.log('\n[1] Registering Accounts for Medication Testing...');
    const resSenior = await fetch(`${BASE_AUTH}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Eleanor Vance',
        email: seniorEmail,
        password: 'Password123!',
        phone: '+1 555-111-2222',
        role: 'elderly',
      }),
    });
    const seniorData = await resSenior.json();
    const seniorToken = seniorData.data.token;
    const seniorId = seniorData.data.user._id;
    assert(resSenior.status === 201, 'Senior Eleanor registered');

    const resNurse = await fetch(`${BASE_AUTH}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Marcus Bell, RN',
        email: caregiverEmail,
        password: 'Password123!',
        phone: '+1 555-444-5555',
        role: 'caregiver',
      }),
    });
    const nurseData = await resNurse.json();
    const nurseToken = nurseData.data.token;
    assert(resNurse.status === 201, 'Caregiver Marcus registered');

    const resStranger = await fetch(`${BASE_AUTH}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Stranger',
        email: strangerEmail,
        password: 'Password123!',
        phone: '+1 555-999-0000',
        role: 'family',
      }),
    });
    const strangerData = await resStranger.json();
    const strangerToken = strangerData.data.token;
    assert(resStranger.status === 201, 'Stranger Bob registered');

    // 2. Authorize Nurse Marcus in Eleanor's Circle with manage_medications
    console.log('\n[2] Authorizing Nurse in Senior Care Circle...');
    const invRes = await fetch(`${BASE_CIRCLE}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        elderlyUserId: seniorId,
        inviteeEmail: caregiverEmail,
        relationshipType: 'nurse',
        permissions: ['view_medications', 'manage_medications'],
      }),
    });
    const invData = await invRes.json();
    const inviteToken = invData.data.invitationToken;

    const acceptRes = await fetch(`${BASE_CIRCLE}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurseToken}`,
      },
      body: JSON.stringify({ token: inviteToken }),
    });
    assert(acceptRes.status === 200, 'Nurse accepted Care Circle invite with manage_medications');

    // 3. Unauthorized Creation Rejection (Stranger tries to create prescription)
    console.log('\n[3] Testing Cross-Account Protection on Prescription Creation...');
    const unauthMedRes = await fetch(`${BASE_MEDS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${strangerToken}`,
      },
      body: JSON.stringify({
        elderlyUserId: seniorId,
        medicineName: 'Unauthorized Med',
        dosage: '100mg',
        scheduledTimes: ['08:00'],
      }),
    });
    assert(unauthMedRes.status === 403, 'Stranger blocked from creating prescription (403 Forbidden)');

    // 4. Edge Case: Multiple Medicines at the Same Time (e.g. 08:00 AM)
    console.log('\n[4] Testing Multiple Medicines at the Same Time (08:00 AM)...');
    const med1Res = await fetch(`${BASE_MEDS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        elderlyUserId: seniorId,
        medicineName: 'Lisinopril',
        dosage: '10mg',
        instructions: 'Take with breakfast and full glass of water',
        frequency: 'daily',
        scheduledTimes: ['08:00', '20:00'],
        pillAppearance: 'Round pink tablet',
        remainingInventory: 30,
        prescribedBy: 'Dr. Robert Chen',
      }),
    });
    const med1Data = await med1Res.json();
    assert(med1Res.status === 201 && med1Data.success, 'Medication 1 (Lisinopril) created');
    const med1Id = med1Data.data._id;

    // Medication 2 created by Nurse Marcus (authorized caregiver) at the exact same 08:00 time
    const med2Res = await fetch(`${BASE_MEDS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurseToken}`,
      },
      body: JSON.stringify({
        elderlyUserId: seniorId,
        medicineName: 'Aspirin',
        dosage: '81mg',
        instructions: 'Take with morning meal',
        frequency: 'daily',
        scheduledTimes: ['08:00'],
        pillAppearance: 'Small yellow round pill',
        remainingInventory: 60,
      }),
    });
    const med2Data = await med2Res.json();
    assert(med2Res.status === 201 && med2Data.success, 'Medication 2 (Aspirin) created by nurse at 08:00');
    const med2Id = med2Data.data._id;

    // 5. Expired Medication Schedule Handling
    console.log('\n[5] Testing Expired Prescription Handling...');
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const expiredMedRes = await fetch(`${BASE_MEDS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        elderlyUserId: seniorId,
        medicineName: 'Finished Antibiotic',
        dosage: '250mg',
        frequency: 'daily',
        scheduledTimes: ['12:00'],
        startDate: twoDaysAgo.toISOString(),
        endDate: yesterday.toISOString(), // Expired!
      }),
    });
    const expiredData = await expiredMedRes.json();
    assert(expiredMedRes.status === 201, 'Expired antibiotic created');

    // 6. Retrieve Today's Schedule & Verify Dose Generation
    console.log("\n[6] Testing Today's Schedule & Co-occurring Dose Generation...");
    const schedRes = await fetch(`${BASE_MEDS}/schedule/${seniorId}/today`, {
      headers: { Authorization: `Bearer ${seniorToken}` },
    });
    const schedData = await schedRes.json();
    assert(schedRes.status === 200 && schedData.success, "Today's schedule retrieved (200 OK)");
    const doses = schedData.data;

    // Should have: Lisinopril at 08:00, Aspirin at 08:00, Lisinopril at 20:00 (Total = 3 doses)
    // Expired Antibiotic must NOT be included!
    assert(doses.length === 3, `Expected 3 active doses today, received ${doses.length}`);
    const eightAmDoses = doses.filter((d) => d.scheduledTimeStr === '08:00');
    assert(
      eightAmDoses.length === 2,
      'Both Lisinopril & Aspirin successfully co-exist at 08:00 AM'
    );
    const hasExpired = doses.some((d) => d.medicationId?.medicineName === 'Finished Antibiotic');
    assert(!hasExpired, 'Expired prescription correctly excluded from today schedule');

    // 7. Duplicate Dose Record Prevention Test
    console.log('\n[7] Testing Duplicate Dose Record Prevention...');
    // Query schedule again: should still be exactly 3 doses, no duplicates created
    const schedRes2 = await fetch(`${BASE_MEDS}/schedule/${seniorId}/today`, {
      headers: { Authorization: `Bearer ${seniorToken}` },
    });
    const schedData2 = await schedRes2.json();
    assert(
      schedData2.data.length === 3,
      'Calling getTodaySchedule repeatedly does NOT create duplicate doses'
    );

    // 8. Confirm Dose as Taken & Inventory Decrement
    console.log('\n[8] Testing Confirm Dose Taken & Inventory Tracking...');
    const doseToTake = eightAmDoses[0];
    const takeRes = await fetch(`${BASE_MEDS}/doses/${doseToTake._id}/take`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({ notes: 'Swallowed with orange juice' }),
    });
    const takeData = await takeRes.json();
    assert(takeRes.status === 200 && takeData.success, 'Dose confirmed as taken (200 OK)');
    assert(takeData.data.status === 'taken', 'Dose status updated to taken');
    assert(!!takeData.data.confirmedAt, 'Confirmed timestamp saved');

    // Verify inventory decremented
    const checkMed1 = await fetch(`${BASE_MEDS}/${med1Id}`, {
      headers: { Authorization: `Bearer ${seniorToken}` },
    });
    const med1CheckData = await checkMed1.json();
    assert(
      med1CheckData.data.remainingInventory === 29,
      'Pill inventory automatically decremented by 1 (30 -> 29)'
    );

    // 9. Duplicate Confirmation Rejection Test
    console.log('\n[9] Testing Duplicate Confirmation Rejection...');
    const dupTakeRes = await fetch(`${BASE_MEDS}/doses/${doseToTake._id}/take`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${seniorToken}`,
      },
    });
    const dupTakeData = await dupTakeRes.json();
    assert(
      dupTakeRes.status === 400 && !dupTakeData.success,
      'Duplicate confirmation correctly rejected with 400 Bad Request'
    );

    // 10. Skip Dose Action by Authorized Nurse
    console.log('\n[10] Testing Skip Dose Action by Caregiver...');
    const doseToSkip = eightAmDoses[1]; // Aspirin
    const skipRes = await fetch(`${BASE_MEDS}/doses/${doseToSkip._id}/skip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurseToken}`,
      },
      body: JSON.stringify({ notes: 'Resident had mild stomach upset, skipped per nurse protocol' }),
    });
    const skipData = await skipRes.json();
    assert(skipRes.status === 200 && skipData.success, 'Dose marked as skipped (200 OK)');
    assert(skipData.data.status === 'skipped', 'Dose status updated to skipped');
    assert(
      skipData.data.notes.includes('stomach upset'),
      'Clinical skip notes recorded'
    );

    // 11. Unauthorized Action on Dose (Stranger tries to confirm dose)
    console.log('\n[11] Testing Unauthorized Dose Confirmation...');
    const eveningDose = doses.find((d) => d.scheduledTimeStr === '20:00');
    const unauthTakeRes = await fetch(`${BASE_MEDS}/doses/${eveningDose._id}/take`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${strangerToken}`,
      },
    });
    assert(
      unauthTakeRes.status === 403,
      'Stranger blocked from confirming medication dose (403 Forbidden)'
    );

    // 12. Adherence Statistics & Medication History
    console.log('\n[12] Testing Adherence Statistics & History...');
    const adhRes = await fetch(`${BASE_MEDS}/adherence/${seniorId}?days=7`, {
      headers: { Authorization: `Bearer ${nurseToken}` },
    });
    const adhData = await adhRes.json();
    assert(adhRes.status === 200 && adhData.success, 'Adherence stats computed (200 OK)');
    assert(adhData.data.takenCount === 1, 'Accurate taken count in stats');
    assert(adhData.data.skippedCount === 1, 'Accurate skipped count in stats');
    assert(typeof adhData.data.adherenceRate === 'number', 'Adherence percentage calculated');

    const histRes = await fetch(`${BASE_MEDS}/history/${seniorId}?limit=10`, {
      headers: { Authorization: `Bearer ${seniorToken}` },
    });
    const histData = await histRes.json();
    assert(histRes.status === 200 && histData.data.doses.length >= 2, 'Paginated history retrieved');

    // 13. Update Medication Schedule while Preserving Past Logs
    console.log('\n[13] Testing Schedule Update Preserving Historical Logs...');
    const updateRes = await fetch(`${BASE_MEDS}/${med1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurseToken}`,
      },
      body: JSON.stringify({
        scheduledTimes: ['09:00', '21:00'],
      }),
    });
    assert(updateRes.status === 200, 'Medication schedule updated');

    // Past taken dose remains intact at 08:00
    const verifyPastDose = await fetch(`${BASE_MEDS}/history/${seniorId}`, {
      headers: { Authorization: `Bearer ${seniorToken}` },
    });
    const pastData = await verifyPastDose.json();
    const pastTaken = pastData.data.doses.find((d) => d._id === doseToTake._id);
    assert(
      pastTaken && pastTaken.status === 'taken',
      'Historical taken dose at 08:00 remains intact and never overwritten'
    );

    console.log(`\n==========================================================`);
    console.log(`MEDICATION MODULE TESTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==========================================================`);
  } catch (err) {
    console.error('Medication test execution failure:', err);
  }
}

runMedicationTests();
