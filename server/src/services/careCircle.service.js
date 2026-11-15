import crypto from 'node:crypto';
import { CareRelationship, PERMISSION_TYPES } from '../models/careRelationship.model.js';
import { CareAuditLog } from '../models/careAuditLog.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyCaregiverAccess } from '../middlewares/careCircleAuth.middleware.js';

/**
 * Invite a family member or caregiver to an elderly user's Care Circle.
 */
export const inviteMember = async ({
  elderlyUserId,
  inviteeEmail,
  relationshipType,
  permissions,
  invitedBy,
  ipAddress = 'unknown',
}) => {
  const normalizedEmail = inviteeEmail.toLowerCase().trim();

  // Verify elderly resident exists
  const elderlyUser = await User.findById(elderlyUserId);
  if (!elderlyUser) {
    throw ApiError.notFound('Resident account not found.');
  }

  // Prevent senior from inviting their own email
  if (elderlyUser.email.toLowerCase() === normalizedEmail) {
    throw ApiError.badRequest('You cannot invite yourself to your own Care Circle.');
  }

  // Authorization check: Only senior resident themselves or admin can issue invitations
  const isSelf = invitedBy._id.toString() === elderlyUserId.toString();
  const isAdmin = invitedBy.role === 'admin';

  if (!isSelf && !isAdmin) {
    // Alternatively, verify if existing caregiver has manage_appointments permission
    await verifyCaregiverAccess(elderlyUserId, invitedBy, 'manage_appointments', ipAddress);
  }

  // Check if an accepted relationship already exists
  const existingActive = await CareRelationship.findOne({
    elderlyUserId,
    inviteeEmail: normalizedEmail,
    invitationStatus: 'accepted',
  });

  if (existingActive) {
    throw ApiError.conflict('This user is already an active member of your Care Circle.');
  }

  // Check if invitee already has a CareCircle account
  const registeredUser = await User.findOne({ email: normalizedEmail });

  // Generate cryptographically secure random invitation token (48-hour validity)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  // Sanitize permissions
  const safePermissions = Array.isArray(permissions) && permissions.length > 0
    ? permissions.filter((p) => PERMISSION_TYPES.includes(p))
    : ['view_medications', 'view_appointments', 'view_health_records'];

  // Check for existing pending invitation to update
  let relationship = await CareRelationship.findOne({
    elderlyUserId,
    inviteeEmail: normalizedEmail,
    invitationStatus: 'pending',
  });

  if (relationship) {
    relationship.invitationToken = hashedToken;
    relationship.invitationExpiresAt = expiresAt;
    relationship.relationshipType = relationshipType || relationship.relationshipType;
    relationship.permissions = safePermissions;
    relationship.invitedBy = invitedBy._id;
    relationship.memberUserId = registeredUser ? registeredUser._id : null;
    await relationship.save();
  } else {
    relationship = await CareRelationship.create({
      elderlyUserId,
      memberUserId: registeredUser ? registeredUser._id : null,
      inviteeEmail: normalizedEmail,
      relationshipType: relationshipType || 'caregiver',
      permissions: safePermissions,
      invitationStatus: 'pending',
      invitationToken: hashedToken,
      invitationExpiresAt: expiresAt,
      invitedBy: invitedBy._id,
    });
  }

  // Audit Log
  await CareAuditLog.create({
    elderlyUserId,
    performedBy: invitedBy._id,
    action: 'INVITATION_CREATED',
    details: {
      inviteeEmail: normalizedEmail,
      relationshipType: relationship.relationshipType,
      permissions: relationship.permissions,
    },
    ipAddress,
  });

  return {
    relationship,
    invitationToken: rawToken, // Raw token returned for email dispatch / API test
    invitationExpiresAt: expiresAt,
  };
};

/**
 * Accept a pending Care Circle invitation.
 */
export const acceptInvitation = async ({ rawToken, memberUser, ipAddress = 'unknown' }) => {
  if (!rawToken) {
    throw ApiError.badRequest('Invitation token is required.');
  }

  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const relationship = await CareRelationship.findOne({
    invitationToken: hashedToken,
    invitationStatus: 'pending',
  }).select('+invitationToken');

  if (!relationship) {
    throw ApiError.badRequest('Invalid or already processed invitation token.');
  }

  if (relationship.invitationExpiresAt < new Date()) {
    throw ApiError.badRequest('This invitation has expired. Please ask the resident to send a new invite.');
  }

  // Verify that the logged-in user matches the intended invitee email
  if (memberUser.email.toLowerCase() !== relationship.inviteeEmail.toLowerCase()) {
    throw ApiError.forbidden(
      `This invitation was issued to ${relationship.inviteeEmail}. You are signed in as ${memberUser.email}.`
    );
  }

  relationship.invitationStatus = 'accepted';
  relationship.memberUserId = memberUser._id;
  relationship.acceptedAt = new Date();
  relationship.invitationToken = undefined;
  await relationship.save();

  // Audit Log
  await CareAuditLog.create({
    elderlyUserId: relationship.elderlyUserId,
    performedBy: memberUser._id,
    action: 'INVITATION_ACCEPTED',
    details: {
      relationshipType: relationship.relationshipType,
      permissions: relationship.permissions,
    },
    ipAddress,
  });

  return relationship;
};

/**
 * Reject a pending Care Circle invitation.
 */
export const rejectInvitation = async ({ rawToken, memberUser, ipAddress = 'unknown' }) => {
  if (!rawToken) {
    throw ApiError.badRequest('Invitation token is required.');
  }

  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const relationship = await CareRelationship.findOne({
    invitationToken: hashedToken,
    invitationStatus: 'pending',
  }).select('+invitationToken');

  if (!relationship) {
    throw ApiError.badRequest('Invalid or already processed invitation token.');
  }

  if (memberUser.email.toLowerCase() !== relationship.inviteeEmail.toLowerCase()) {
    throw ApiError.forbidden('You are not authorized to reject this invitation.');
  }

  relationship.invitationStatus = 'rejected';
  relationship.invitationToken = undefined;
  await relationship.save();

  // Audit Log
  await CareAuditLog.create({
    elderlyUserId: relationship.elderlyUserId,
    performedBy: memberUser._id,
    action: 'INVITATION_REJECTED',
    details: {
      relationshipType: relationship.relationshipType,
    },
    ipAddress,
  });

  return { message: 'Invitation declined successfully.' };
};

/**
 * Remove an existing member or leave a Care Circle.
 */
export const removeMember = async ({ relationshipId, requestedBy, ipAddress = 'unknown' }) => {
  const relationship = await CareRelationship.findById(relationshipId);
  if (!relationship) {
    throw ApiError.notFound('Care Circle relationship record not found.');
  }

  const isSenior = relationship.elderlyUserId.toString() === requestedBy._id.toString();
  const isMember = relationship.memberUserId && relationship.memberUserId.toString() === requestedBy._id.toString();
  const isAdmin = requestedBy.role === 'admin';

  if (!isSenior && !isMember && !isAdmin) {
    throw ApiError.forbidden('You do not have permission to revoke this membership.');
  }

  relationship.invitationStatus = 'revoked';
  relationship.revokedAt = new Date();
  relationship.revokedBy = requestedBy._id;
  await relationship.save();

  // Audit Log
  await CareAuditLog.create({
    elderlyUserId: relationship.elderlyUserId,
    performedBy: requestedBy._id,
    action: 'MEMBER_REMOVED',
    details: {
      relationshipId,
      revokedMemberId: relationship.memberUserId,
      revokedByRole: requestedBy.role,
    },
    ipAddress,
  });

  return relationship;
};

/**
 * Update permissions for an existing Care Circle member.
 */
export const updatePermissions = async ({
  relationshipId,
  permissions,
  requestedBy,
  ipAddress = 'unknown',
}) => {
  const relationship = await CareRelationship.findById(relationshipId);
  if (!relationship) {
    throw ApiError.notFound('Care Circle relationship record not found.');
  }

  // Only the senior resident themselves or an admin can update member permissions
  const isSenior = relationship.elderlyUserId.toString() === requestedBy._id.toString();
  const isAdmin = requestedBy.role === 'admin';

  if (!isSenior && !isAdmin) {
    throw ApiError.forbidden('Only the resident senior can modify care circle permissions.');
  }

  const safePermissions = permissions.filter((p) => PERMISSION_TYPES.includes(p));
  const previousPermissions = [...relationship.permissions];
  relationship.permissions = safePermissions;
  await relationship.save();

  // Audit Log
  await CareAuditLog.create({
    elderlyUserId: relationship.elderlyUserId,
    performedBy: requestedBy._id,
    action: 'PERMISSIONS_UPDATED',
    details: {
      relationshipId,
      previousPermissions,
      newPermissions: safePermissions,
    },
    ipAddress,
  });

  return relationship;
};

/**
 * Get all connected, accepted members of an elderly user's Care Circle.
 */
export const getElderlyCareCircle = async ({ elderlyUserId, requestedBy }) => {
  // Authorization check: must be senior themselves, an accepted member, or admin
  const isSenior = elderlyUserId.toString() === requestedBy._id.toString();
  const isAdmin = requestedBy.role === 'admin';

  if (!isSenior && !isAdmin) {
    await verifyCaregiverAccess(elderlyUserId, requestedBy, null);
  }

  const members = await CareRelationship.find({
    elderlyUserId,
    invitationStatus: 'accepted',
  })
    .populate('memberUserId', 'name email phone role profileImage')
    .sort({ createdAt: -1 });

  return members;
};

/**
 * View pending invitations for a resident's Care Circle.
 */
export const getPendingInvitations = async ({ elderlyUserId, requestedBy }) => {
  const isSenior = elderlyUserId.toString() === requestedBy._id.toString();
  const isAdmin = requestedBy.role === 'admin';

  if (!isSenior && !isAdmin) {
    throw ApiError.forbidden('Only the senior resident can view pending circle invitations.');
  }

  const pending = await CareRelationship.find({
    elderlyUserId,
    invitationStatus: 'pending',
  })
    .populate('invitedBy', 'name email role')
    .sort({ createdAt: -1 });

  return pending;
};

/**
 * Get all Care Circles that the logged-in user belongs to.
 */
export const getMyConnectedCircles = async ({ memberUserId }) => {
  const circles = await CareRelationship.find({
    memberUserId,
    invitationStatus: 'accepted',
  })
    .populate('elderlyUserId', 'name email phone profileImage accountStatus')
    .sort({ acceptedAt: -1 });

  return circles;
};

/**
 * Access sensitive resident summary to verify cross-account data isolation.
 */
export const getElderlyResidentSummary = async ({ elderlyUserId, requestedBy, ipAddress = 'unknown' }) => {
  // Requires explicit 'view_medications' permission
  const relationship = await verifyCaregiverAccess(
    elderlyUserId,
    requestedBy,
    'view_medications',
    ipAddress
  );

  const elderlyUser = await User.findById(elderlyUserId);
  if (!elderlyUser) {
    throw ApiError.notFound('Resident not found.');
  }

  // Audit sensitive access
  await CareAuditLog.create({
    elderlyUserId,
    performedBy: requestedBy._id,
    action: 'RESIDENT_DATA_ACCESSED',
    details: {
      resource: 'Resident Summary',
      grantedPermissions: relationship ? relationship.permissions : ['full_owner_access'],
    },
    ipAddress,
  });

  return {
    resident: {
      id: elderlyUser._id,
      name: elderlyUser.name,
      email: elderlyUser.email,
      phone: elderlyUser.phone,
    },
    authorizedPermissions: relationship ? relationship.permissions : ['full_owner_access'],
    activeCaregiversCount: await CareRelationship.countDocuments({
      elderlyUserId,
      invitationStatus: 'accepted',
    }),
  };
};

export default {
  inviteMember,
  acceptInvitation,
  rejectInvitation,
  removeMember,
  updatePermissions,
  getElderlyCareCircle,
  getPendingInvitations,
  getMyConnectedCircles,
  getElderlyResidentSummary,
};
