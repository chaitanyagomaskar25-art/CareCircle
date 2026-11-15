import * as caregiverService from '../services/caregiver.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getClientIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  req.socket?.remoteAddress ||
  'unknown';

/**
 * @route GET /api/v1/caregiver/overview
 * @desc  Retrieve aggregated dashboard data across all explicitly authorized elderly residents
 */
export const getDashboardOverview = asyncHandler(async (req, res) => {
  const data = await caregiverService.getCaregiverDashboardOverview(req.user);
  return ApiResponse.ok(res, data, 'Caregiver dashboard overview retrieved.');
});

/**
 * @route GET /api/v1/caregiver/elderly/:elderlyId
 * @desc  Retrieve detailed individual care overview for an authorized senior
 */
export const getElderlyDetail = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const { status, startDate, endDate } = req.query;

  const data = await caregiverService.getCaregiverElderlyDetail({
    elderlyId,
    caregiverUser: req.user,
    filters: { status, startDate, endDate },
    ipAddress: getClientIp(req),
  });

  return ApiResponse.ok(res, data, 'Elderly resident care overview retrieved.');
});

/**
 * @route POST /api/v1/caregiver/elderly/:elderlyId/observations
 * @desc  Record a vital sign or health observation for an authorized senior
 */
export const addObservation = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const observation = await caregiverService.recordHealthObservation({
    elderlyUserId: elderlyId,
    author: req.user,
    ...req.body,
    ipAddress: getClientIp(req),
  });

  return ApiResponse.created(res, observation, 'Health observation recorded.');
});

/**
 * @route POST /api/v1/caregiver/elderly/:elderlyId/notes
 * @desc  Add a clinical care note
 */
export const addNote = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const careNote = await caregiverService.recordCareNote({
    elderlyUserId: elderlyId,
    author: req.user,
    ...req.body,
    ipAddress: getClientIp(req),
  });

  return ApiResponse.created(res, careNote, 'Care note recorded.');
});

/**
 * @route POST /api/v1/caregiver/elderly/:elderlyId/appointments
 * @desc  Schedule a healthcare appointment
 */
export const addAppointment = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const appointment = await caregiverService.scheduleAppointment({
    elderlyUserId: elderlyId,
    author: req.user,
    ...req.body,
    ipAddress: getClientIp(req),
  });

  return ApiResponse.created(res, appointment, 'Appointment scheduled successfully.');
});

export default {
  getDashboardOverview,
  getElderlyDetail,
  addObservation,
  addNote,
  addAppointment,
};
