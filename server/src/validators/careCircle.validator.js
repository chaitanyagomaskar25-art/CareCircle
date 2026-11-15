import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import {
  RELATIONSHIP_TYPES,
  PERMISSION_TYPES,
} from '../models/careRelationship.model.js';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const validateInvite = (req, res, next) => {
  const { elderlyUserId, inviteeEmail, relationshipType, permissions } = req.body;
  const errors = [];

  if (!elderlyUserId || !mongoose.Types.ObjectId.isValid(elderlyUserId)) {
    errors.push('A valid elderly resident user ID is required.');
  }

  if (!inviteeEmail || !emailRegex.test(inviteeEmail.trim())) {
    errors.push('A valid invitee email address is required.');
  }

  if (relationshipType && !RELATIONSHIP_TYPES.includes(relationshipType)) {
    errors.push(
      `Invalid relationship type. Allowed values: ${RELATIONSHIP_TYPES.join(', ')}.`
    );
  }

  if (permissions && Array.isArray(permissions)) {
    for (const p of permissions) {
      if (!PERMISSION_TYPES.includes(p)) {
        errors.push(`Invalid permission '${p}'. Allowed: ${PERMISSION_TYPES.join(', ')}.`);
      }
    }
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Care Circle invitation validation failed.', errors));
  }

  next();
};

export const validateUpdatePermissions = (req, res, next) => {
  const { permissions } = req.body;
  const errors = [];

  if (!Array.isArray(permissions) || permissions.length === 0) {
    errors.push('Permissions must be a non-empty array.');
  } else {
    for (const p of permissions) {
      if (!PERMISSION_TYPES.includes(p)) {
        errors.push(`Invalid permission '${p}'. Allowed: ${PERMISSION_TYPES.join(', ')}.`);
      }
    }
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Permission update validation failed.', errors));
  }

  next();
};

export const validateAcceptReject = (req, res, next) => {
  const { token } = req.body;

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return next(ApiError.badRequest('Invitation token is required.'));
  }

  next();
};

export default {
  validateInvite,
  validateUpdatePermissions,
  validateAcceptReject,
};
