import * as careCircleService from '../services/careCircle.service.js';
import { CareAuditLog } from '../models/careAuditLog.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

const getClientIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  req.socket?.remoteAddress ||
  'unknown';

/**
 * @route POST /api/v1/care-circle/invite
 * @desc  Invite a family member or caregiver to join a Care Circle
 */
export const invite = asyncHandler(async (req, res) => {
  const result = await careCircleService.inviteMember({
    ...req.body,
    invitedBy: req.user,
    ipAddress: getClientIp(req),
  });

  return ApiResponse.created(
    res,
    result,
    `Invitation dispatched to ${req.body.inviteeEmail}. Valid for 48 hours.`
  );
});

/**
 * @route POST /api/v1/care-circle/accept
 * @desc  Accept a pending Care Circle invitation
 */
export const accept = asyncHandler(async (req, res) => {
  const relationship = await careCircleService.acceptInvitation({
    rawToken: req.body.token,
    memberUser: req.user,
    ipAddress: getClientIp(req),
  });

  return ApiResponse.ok(res, relationship, 'Care Circle invitation accepted successfully.');
});

/**
 * @route POST /api/v1/care-circle/reject
 * @desc  Decline a pending Care Circle invitation
 */
export const reject = asyncHandler(async (req, res) => {
  const result = await careCircleService.rejectInvitation({
    rawToken: req.body.token,
    memberUser: req.user,
    ipAddress: getClientIp(req),
  });

  return ApiResponse.ok(res, result, result.message);
});

/**
 * @route DELETE /api/v1/care-circle/member/:relationshipId
 * @desc  Revoke or leave an existing Care Circle membership
 */
export const remove = asyncHandler(async (req, res) => {
  const { relationshipId } = req.params;
  const result = await careCircleService.removeMember({
    relationshipId,
    requestedBy: req.user,
    ipAddress: getClientIp(req),
  });

  return ApiResponse.ok(res, result, 'Member removed from Care Circle successfully.');
});

/**
 * @route PATCH /api/v1/care-circle/member/:relationshipId/permissions
 * @desc  Update permissions for an existing member
 */
export const updatePermissions = asyncHandler(async (req, res) => {
  const { relationshipId } = req.params;
  const result = await careCircleService.updatePermissions({
    relationshipId,
    permissions: req.body.permissions,
    requestedBy: req.user,
    ipAddress: getClientIp(req),
  });

  return ApiResponse.ok(res, result, 'Care Circle member permissions updated successfully.');
});

/**
 * @route GET /api/v1/care-circle/elderly/:elderlyId/members
 * @desc  View all active, accepted members of a resident's Care Circle
 */
export const getMembers = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const members = await careCircleService.getElderlyCareCircle({
    elderlyUserId: elderlyId,
    requestedBy: req.user,
  });

  return ApiResponse.ok(res, members, 'Care Circle members retrieved successfully.');
});

/**
 * @route GET /api/v1/care-circle/elderly/:elderlyId/pending
 * @desc  View all pending outgoing invitations for an elderly resident
 */
export const getPending = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const pending = await careCircleService.getPendingInvitations({
    elderlyUserId: elderlyId,
    requestedBy: req.user,
  });

  return ApiResponse.ok(res, pending, 'Pending circle invitations retrieved.');
});

/**
 * @route GET /api/v1/care-circle/my-circles
 * @desc  Get all Care Circles that the logged-in user has joined
 */
export const getMyCircles = asyncHandler(async (req, res) => {
  const circles = await careCircleService.getMyConnectedCircles({
    memberUserId: req.user._id,
  });

  return ApiResponse.ok(res, circles, 'Connected Care Circles retrieved.');
});

/**
 * @route GET /api/v1/care-circle/elderly/:elderlyId/summary
 * @desc  Sensitive medical summary access requiring explicit authorization & audit logging
 */
export const getResidentSummary = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const summary = await careCircleService.getElderlyResidentSummary({
    elderlyUserId: elderlyId,
    requestedBy: req.user,
    ipAddress: getClientIp(req),
  });

  return ApiResponse.ok(res, summary, 'Resident health overview retrieved.');
});

/**
 * @route GET /api/v1/care-circle/elderly/:elderlyId/audit-logs
 * @desc  Audit log retrieval for sensitive care circle actions
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;

  // Only the senior resident or admin can inspect audit logs
  const isSenior = elderlyId.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isSenior && !isAdmin) {
    throw ApiError.forbidden('Only the resident senior or system admin can review circle audit logs.');
  }

  const logs = await CareAuditLog.find({ elderlyUserId: elderlyId })
    .populate('performedBy', 'name email role')
    .sort({ createdAt: -1 })
    .limit(50);

  return ApiResponse.ok(res, logs, 'Care Circle audit logs retrieved.');
});

export default {
  invite,
  accept,
  reject,
  remove,
  updatePermissions,
  getMembers,
  getPending,
  getMyCircles,
  getResidentSummary,
  getAuditLogs,
};
