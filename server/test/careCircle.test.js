const BASE_AUTH = 'http://localhost:5000/api/v1/auth';
const BASE_CIRCLE = 'http://localhost:5000/api/v1/care-circle';

async function runCareCircleTests() {
  console.log('--- STARTING CARE CIRCLE & CROSS-ACCOUNT ISOLATION TEST SUITE ---');
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
    const seniorEmail = `resident_eleanor_${ts}@carecircle.test`;
    const daughterEmail = `daughter_sarah_${ts}@carecircle.test`;
    const strangerEmail = `stranger_bob_${ts}@carecircle.test`;

    // 1. Setup Accounts
    console.log('\n[1] Registering Accounts for Testing...');
    const resElderly = await fetch(`${BASE_AUTH}/register`, {
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
    const elderlyData = await resElderly.json();
    const elderlyToken = elderlyData.data.token;
    const elderlyId = elderlyData.data.user._id;
    assert(resElderly.status === 201, 'Senior Eleanor registered');

    const resDaughter = await fetch(`${BASE_AUTH}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sarah Vance',
        email: daughterEmail,
        password: 'Password123!',
        phone: '+1 555-333-4444',
        role: 'family',
      }),
    });
    const daughterData = await resDaughter.json();
    const daughterToken = daughterData.data.token;
    const daughterId = daughterData.data.user._id;
    assert(resDaughter.status === 201, 'Daughter Sarah registered');

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

    // 2. Cross-Account Data Isolation Test (BEFORE ANY INVITATION)
    console.log('\n[2] Testing Cross-Account Data Isolation (Unauthorized Access)...');
    const isoRes = await fetch(`${BASE_CIRCLE}/elderly/${elderlyId}/summary`, {
      headers: { Authorization: `Bearer ${strangerToken}` },
    });
    const isoData = await isoRes.json();
    assert(
      isoRes.status === 403 && !isoData.success,
      'Stranger Bob blocked with 403 Forbidden from accessing Eleanor data',
      JSON.stringify(isoData)
    );
    assert(
      isoData.message.includes('not an authorized member'),
      'Clear descriptive error message returned without leaking data'
    );

    // 3. Senior Invites Daughter Sarah
    console.log('\n[3] Testing Invitation Creation by Senior...');
    const inviteRes = await fetch(`${BASE_CIRCLE}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${elderlyToken}`,
      },
      body: JSON.stringify({
        elderlyUserId: elderlyId,
        inviteeEmail: daughterEmail,
        relationshipType: 'daughter',
        permissions: ['view_medications', 'view_appointments'],
      }),
    });
    const inviteData = await inviteRes.json();
    assert(inviteRes.status === 201 && inviteData.success, 'Invitation created with 201 Created');
    const rawInviteToken = inviteData.data.invitationToken;
    const relationshipId = inviteData.data.relationship._id;
    assert(!!rawInviteToken, 'Raw cryptographic invitation token returned');
    assert(inviteData.data.relationship.invitationStatus === 'pending', 'Invitation status is pending');
    assert(
      inviteData.data.relationship.permissions.length === 2,
      'Configured permissions saved correctly'
    );

    // 4. Token Theft Prevention Test
    console.log('\n[4] Testing Token Theft Prevention (Wrong Account Accepting)...');
    const theftRes = await fetch(`${BASE_CIRCLE}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${strangerToken}`,
      },
      body: JSON.stringify({ token: rawInviteToken }),
    });
    const theftData = await theftRes.json();
    assert(
      theftRes.status === 403 && !theftData.success,
      'Stranger Bob blocked with 403 from accepting invitation issued to Sarah'
    );

    // 5. Intended Invitee Accepts Invitation
    console.log('\n[5] Testing Legitimate Invitation Acceptance...');
    const acceptRes = await fetch(`${BASE_CIRCLE}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${daughterToken}`,
      },
      body: JSON.stringify({ token: rawInviteToken }),
    });
    const acceptData = await acceptRes.json();
    assert(acceptRes.status === 200 && acceptData.success, 'Invitation accepted with 200 OK');
    assert(acceptData.data.invitationStatus === 'accepted', 'Relationship status updated to accepted');
    assert(acceptData.data.memberUserId === daughterId, 'Member user ID linked to accepted relationship');

    // 6. Authorized Data Access (AFTER ACCEPTING)
    console.log('\n[6] Testing Authorized Data Access for Accepted Caregiver...');
    const authSummaryRes = await fetch(`${BASE_CIRCLE}/elderly/${elderlyId}/summary`, {
      headers: { Authorization: `Bearer ${daughterToken}` },
    });
    const authSummaryData = await authSummaryRes.json();
    assert(
      authSummaryRes.status === 200 && authSummaryData.success,
      'Authorized daughter Sarah successfully accesses Eleanor summary'
    );
    assert(
      authSummaryData.data.resident.name === 'Eleanor Vance',
      'Accurate resident overview returned'
    );

    // 7. Update Member Permissions
    console.log('\n[7] Testing Permission Management...');
    // Stranger tries to update permissions -> Forbidden
    const unauthUpdateRes = await fetch(`${BASE_CIRCLE}/member/${relationshipId}/permissions`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${strangerToken}`,
      },
      body: JSON.stringify({
        permissions: ['manage_medications'],
      }),
    });
    assert(unauthUpdateRes.status === 403, 'Unauthorized permission modification rejected (403)');

    // Senior updates daughter permissions
    const seniorUpdateRes = await fetch(`${BASE_CIRCLE}/member/${relationshipId}/permissions`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${elderlyToken}`,
      },
      body: JSON.stringify({
        permissions: [
          'view_medications',
          'manage_medications',
          'view_appointments',
          'add_health_observations',
        ],
      }),
    });
    const seniorUpdateData = await seniorUpdateRes.json();
    assert(
      seniorUpdateRes.status === 200 && seniorUpdateData.data.permissions.includes('manage_medications'),
      'Senior successfully updated daughter permissions'
    );

    // 8. View Circle Members & Connected Circles
    console.log('\n[8] Testing Circle Member Queries...');
    const circleMembersRes = await fetch(`${BASE_CIRCLE}/elderly/${elderlyId}/members`, {
      headers: { Authorization: `Bearer ${elderlyToken}` },
    });
    const circleMembersData = await circleMembersRes.json();
    assert(
      circleMembersRes.status === 200 && circleMembersData.data.length === 1,
      'Senior retrieves connected circle members'
    );
    assert(
      circleMembersData.data[0].memberUserId.name === 'Sarah Vance',
      'Populated member user profile returned'
    );

    // Daughter queries her connected circles
    const myCirclesRes = await fetch(`${BASE_CIRCLE}/my-circles`, {
      headers: { Authorization: `Bearer ${daughterToken}` },
    });
    const myCirclesData = await myCirclesRes.json();
    assert(
      myCirclesRes.status === 200 && myCirclesData.data.length === 1,
      'Daughter retrieves circles she is part of'
    );

    // 9. Member Removal
    console.log('\n[9] Testing Member Removal & Revocation...');
    // Stranger tries to remove Sarah -> Forbidden
    const unauthRemoveRes = await fetch(`${BASE_CIRCLE}/member/${relationshipId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${strangerToken}` },
    });
    assert(unauthRemoveRes.status === 403, 'Unauthorized member removal blocked (403)');

    // Senior removes daughter
    const removeRes = await fetch(`${BASE_CIRCLE}/member/${relationshipId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${elderlyToken}` },
    });
    const removeData = await removeRes.json();
    assert(removeRes.status === 200, 'Member revoked successfully (200 OK)');
    assert(removeData.data.invitationStatus === 'revoked', 'Status marked as revoked');

    // Now daughter tries to access summary again -> blocked!
    const postRevokeRes = await fetch(`${BASE_CIRCLE}/elderly/${elderlyId}/summary`, {
      headers: { Authorization: `Bearer ${daughterToken}` },
    });
    assert(
      postRevokeRes.status === 403,
      'Revoked member immediately blocked from accessing resident data (403)'
    );

    // 10. Audit Log Verification
    console.log('\n[10] Testing Audit Log Recording & Privacy...');
    // Stranger tries to read Eleanor audit logs -> Forbidden
    const unauthLogs = await fetch(`${BASE_CIRCLE}/elderly/${elderlyId}/audit-logs`, {
      headers: { Authorization: `Bearer ${strangerToken}` },
    });
    assert(unauthLogs.status === 403, 'Stranger forbidden from accessing resident audit logs (403)');

    // Senior reads audit logs
    const auditRes = await fetch(`${BASE_CIRCLE}/elderly/${elderlyId}/audit-logs`, {
      headers: { Authorization: `Bearer ${elderlyToken}` },
    });
    const auditData = await auditRes.json();
    assert(auditRes.status === 200 && auditData.data.length > 0, 'Senior retrieved audit trail');

    const actions = auditData.data.map((l) => l.action);
    assert(actions.includes('INVITATION_CREATED'), 'Audit log recorded INVITATION_CREATED');
    assert(actions.includes('UNAUTHORIZED_ACCESS_BLOCKED'), 'Audit log recorded UNAUTHORIZED_ACCESS_BLOCKED');
    assert(actions.includes('INVITATION_ACCEPTED'), 'Audit log recorded INVITATION_ACCEPTED');
    assert(actions.includes('RESIDENT_DATA_ACCESSED'), 'Audit log recorded RESIDENT_DATA_ACCESSED');
    assert(actions.includes('PERMISSIONS_UPDATED'), 'Audit log recorded PERMISSIONS_UPDATED');
    assert(actions.includes('MEMBER_REMOVED'), 'Audit log recorded MEMBER_REMOVED');

    console.log(`\n======================================================`);
    console.log(`CARE CIRCLE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`======================================================`);
  } catch (err) {
    console.error('Care circle test execution failure:', err);
  }
}

runCareCircleTests();
