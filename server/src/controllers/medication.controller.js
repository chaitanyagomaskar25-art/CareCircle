import * as medicationService from '../services/medication.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getClientIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  req.socket?.remoteAddress ||
  'unknown';

/**
 * @route POST /api/v1/medications
 * @desc  Create a new medication prescription
 */
export const create = asyncHandler(async (req, res) => {
  const medication = await medicationService.createMedication({
    ...req.body,
    createdBy: req.user,
    ipAddress: getClientIp(req),
  });

  return ApiResponse.created(res, medication, 'Medication created successfully.');
});

/**
 * @route GET /api/v1/medications
 * @desc  Get medications for an elderly resident
 */
export const getAll = asyncHandler(async (req, res) => {
  const elderlyUserId = req.query.elderlyUserId || req.user._id;
  const status = req.query.status;

  const medications = await medicationService.getMedications({
    elderlyUserId,
    status,
    requester: req.user,
  });

  return ApiResponse.ok(res, medications, 'Medications retrieved successfully.');
});

/**
 * @route GET /api/v1/medications/:id
 * @desc  Get a single medication prescription
 */
export const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const medication = await medicationService.getMedicationById({
    id,
    requester: req.user,
  });

  return ApiResponse.ok(res, medication, 'Medication retrieved successfully.');
});

/**
 * @route PUT /api/v1/medications/:id
 * @desc  Update medication prescription
 */
export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const medication = await medicationService.updateMedication({
    id,
    updates: req.body,
    requester: req.user,
    ipAddress: getClientIp(req),
  });

  return ApiResponse.ok(res, medication, 'Medication updated successfully.');
});

/**
 * @route DELETE /api/v1/medications/:id
 * @desc  Discontinue a medication
 */
export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await medicationService.deleteMedication({
    id,
    requester: req.user,
    ipAddress: getClientIp(req),
  });

  return ApiResponse.ok(res, result, result.message);
});

/**
 * @route GET /api/v1/medications/schedule/:elderlyId/today
 * @desc  Retrieve today's individual scheduled doses
 */
export const getSchedule = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const targetDate = req.query.date ? new Date(req.query.date) : new Date();

  const schedule = await medicationService.getTodaySchedule({
    elderlyUserId: elderlyId,
    targetDate,
    requester: req.user,
  });

  return ApiResponse.ok(res, schedule, "Today's medication schedule retrieved.");
});

/**
 * @route POST /api/v1/medications/doses/:doseId/take
 * @desc  Confirm a scheduled dose as taken
 */
export const confirmDose = asyncHandler(async (req, res) => {
  const { doseId } = req.params;
  const dose = await medicationService.confirmDoseTaken({
    doseId,
    requester: req.user,
    notes: req.body.notes,
    ipAddress: getClientIp(req),
  });

  return ApiResponse.ok(res, dose, 'Medication dose confirmed as taken.');
});

/**
 * @route POST /api/v1/medications/doses/:doseId/skip
 * @desc  Mark a scheduled dose as skipped
 */
export const skipDose = asyncHandler(async (req, res) => {
  const { doseId } = req.params;
  const dose = await medicationService.skipDose({
    doseId,
    requester: req.user,
    notes: req.body.notes,
    ipAddress: getClientIp(req),
  });

  return ApiResponse.ok(res, dose, 'Medication dose marked as skipped.');
});

/**
 * @route GET /api/v1/medications/history/:elderlyId
 * @desc  Retrieve paginated medication dose history
 */
export const getHistory = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const { startDate, endDate, status, medicationId, limit, page } = req.query;

  const history = await medicationService.getMedicationHistory({
    elderlyUserId: elderlyId,
    requester: req.user,
    startDate,
    endDate,
    status,
    medicationId,
    limit,
    page,
  });

  return ApiResponse.ok(res, history, 'Medication history retrieved successfully.');
});

/**
 * @route GET /api/v1/medications/adherence/:elderlyId
 * @desc  Calculate adherence statistics
 */
export const getAdherence = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const days = req.query.days ? parseInt(req.query.days, 10) : 7;

  const stats = await medicationService.getAdherenceStats({
    elderlyUserId: elderlyId,
    requester: req.user,
    days,
  });

  return ApiResponse.ok(res, stats, 'Medication adherence statistics computed.');
});

export default {
  create,
  getAll,
  getById,
  update,
  remove,
  getSchedule,
  confirmDose,
  skipDose,
  getHistory,
  getAdherence,
};
