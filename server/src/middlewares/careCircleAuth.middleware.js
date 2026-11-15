import mongoose from 'mongoose';
import { CareRelationship } from '../models/careRelationship.model.js';
import { CareAuditLog } from '../models/careAuditLog.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Core reusable service method verifying caregiver authorization and permission scope.
 *
 * @param {string|mongoose.Types.ObjectId} elderlyUserId - The senior whose data is being accessed
 * @param {object} requester - Authenticated User document (req.user)
 * @param {string|null} requiredPermission - Specific permission string (e.g. 'view_medications')
 * @param {string} ipAddress - Client IP for audit logging
 * @returns {Promise<CareRelationship|null>} The validated relationship or null for self/admin
 */
export const verifyCaregiverAccess = async (
  elderlyUserId,
  requester,
  requiredPermission = null,
  ipAddress = 'unknown'
) => {
  if (!elderlyUserId) {
    throw ApiError.badRequest('Resident user ID is required for authorization check.');
  }

  const elderlyIdStr = elderlyUserId.toString();
  const requesterIdStr = requester._id.toString();

  // 1. Elderly residents always have full access to their own data
  if (requesterIdStr === elderlyIdStr) {
    return null;
  }

  // 2. Administrators have platform-wide oversight
  if (requester.role === 'admin') {
    return null;
  }

  // 3. Query active, accepted Care Circle relationship
  const relationship = await CareRelationship.findOne({
    elderlyUserId,
    memberUserId: requester._id,
    invitationStatus: 'accepted',
  });

  // Cross-account isolation: Reject if no authorized relationship exists
  if (!relationship) {
    await CareAuditLog.create({
      elderlyUserId,
      performedBy: requester._id,
      action: 'UNAUTHORIZED_ACCESS_BLOCKED',
      details: {
        reason: 'No active Care Circle relationship exists',
        requiredPermission,
      },
      ipAddress,
    });

    throw ApiError.forbidden(
      "Access denied: You are not an authorized member of this resident's Care Circle."
    );
  }

  // 4. Check specific permission if requested
  if (requiredPermission && !relationship.permissions.includes(requiredPermission)) {
    await CareAuditLog.create({
      elderlyUserId,
      performedBy: requester._id,
      action: 'UNAUTHORIZED_ACCESS_BLOCKED',
      details: {
        reason: 'Insufficient permission scope',
        requiredPermission,
        grantedPermissions: relationship.permissions,
      },
      ipAddress,
    });

    throw ApiError.forbidden(
      `Access denied: You do not have the '${requiredPermission}' permission for this resident.`
    );
  }

  return relationship;
};

/**
 * Express middleware to enforce Care Circle permissions on routes.
 *
 * @param {string|null} requiredPermission - Permission string (from PERMISSION_TYPES)
 * @param {Function} elderlyIdExtractor - Function to extract elderlyUserId from request
 */
export const requireCareCirclePermission = (
  requiredPermission = null,
  elderlyIdExtractor = (req) => req.params.elderlyId || req.body.elderlyUserId
) => {
  return asyncHandler(async (req, res, next) => {
    const elderlyId = elderlyIdExtractor(req);
    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const relationship = await verifyCaregiverAccess(
      elderlyId,
      req.user,
      requiredPermission,
      ipAddress
    );

    req.careRelationship = relationship;
    next();
  });
};

export default {
  verifyCaregiverAccess,
  requireCareCirclePermission,
};
