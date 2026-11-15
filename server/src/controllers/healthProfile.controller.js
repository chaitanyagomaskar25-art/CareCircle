import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as healthService from '../services/healthProfile.service.js';

const getClientIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

export const getHealthProfile = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const data = await healthService.getHealthProfile(elderlyId, req.user, getClientIp(req));
  return res.status(200).json(new ApiResponse(200, data, 'Health profile retrieved successfully.'));
});

export const updateHealthProfile = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const profile = await healthService.updateHealthProfile(elderlyId, req.body, req.user, getClientIp(req));
  return res.status(200).json(new ApiResponse(200, profile, 'Health profile updated successfully.'));
});

export const addMedicalCondition = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const profile = await healthService.addMedicalCondition(elderlyId, req.body, req.user, getClientIp(req));
  return res.status(201).json(new ApiResponse(201, profile, 'Medical condition added successfully.'));
});

export const removeMedicalCondition = asyncHandler(async (req, res) => {
  const { elderlyId, conditionId } = req.params;
  const profile = await healthService.removeMedicalCondition(elderlyId, conditionId, req.user, getClientIp(req));
  return res.status(200).json(new ApiResponse(200, profile, 'Medical condition removed successfully.'));
});

export const addAllergy = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const profile = await healthService.addAllergy(elderlyId, req.body, req.user, getClientIp(req));
  return res.status(201).json(new ApiResponse(201, profile, 'Allergy record added successfully.'));
});

export const removeAllergy = asyncHandler(async (req, res) => {
  const { elderlyId, allergyId } = req.params;
  const profile = await healthService.removeAllergy(elderlyId, allergyId, req.user, getClientIp(req));
  return res.status(200).json(new ApiResponse(200, profile, 'Allergy record removed successfully.'));
});

export const addEmergencyContact = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const profile = await healthService.addEmergencyContact(elderlyId, req.body, req.user, getClientIp(req));
  return res.status(201).json(new ApiResponse(201, profile, 'Emergency contact added successfully.'));
});

export const addDoctorInformation = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const profile = await healthService.addDoctorInformation(elderlyId, req.body, req.user, getClientIp(req));
  return res.status(201).json(new ApiResponse(201, profile, 'Doctor information added successfully.'));
});

export const recordObservation = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const {
    metricType,
    type,
    value,
    unit,
    recordedAt,
    notes,
    recordSource,
    title,
    systolic,
    diastolic,
    numericValue,
  } = req.body;

  const result = await healthService.recordObservation({
    elderlyUserId: elderlyId,
    metricType: metricType || type,
    value,
    unit,
    recordedAt,
    recordedBy: req.user,
    notes,
    recordSource: recordSource || 'manual',
    title,
    systolic,
    diastolic,
    numericValue,
    ipAddress: getClientIp(req),
  });

  return res.status(201).json(new ApiResponse(201, result, 'Health observation recorded successfully.'));
});

export const getHistoricalObservations = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const { metricType, recordSource, startDate, endDate, limit, page } = req.query;

  const result = await healthService.getHistoricalObservations({
    elderlyUserId: elderlyId,
    requester: req.user,
    metricType,
    recordSource,
    startDate,
    endDate,
    limit,
    page,
    ipAddress: getClientIp(req),
  });

  return res.status(200).json(new ApiResponse(200, result, 'Historical observations retrieved successfully.'));
});

export const getHistoricalTrends = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const { metricType, days, startDate, endDate } = req.query;

  const result = await healthService.getHistoricalTrends({
    elderlyUserId: elderlyId,
    requester: req.user,
    metricType,
    days,
    startDate,
    endDate,
    ipAddress: getClientIp(req),
  });

  return res.status(200).json(new ApiResponse(200, result, 'Historical trends retrieved successfully.'));
});

export const recordDailyWellnessCheckIn = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const { feeling, energyLevel, sleepQuality, waterIntakeGlasses, notes } = req.body;

  const result = await healthService.recordDailyWellnessCheckIn({
    elderlyUserId: elderlyId,
    recordedBy: req.user,
    feeling,
    energyLevel,
    sleepQuality,
    waterIntakeGlasses,
    notes,
    ipAddress: getClientIp(req),
  });

  return res.status(201).json(new ApiResponse(201, result, 'Daily wellness check-in recorded successfully.'));
});

export const getTodayWellnessCheckIn = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;
  const result = await healthService.getTodayWellnessCheckIn(elderlyId, req.user, getClientIp(req));
  return res.status(200).json(new ApiResponse(200, result, "Today's wellness check-in retrieved successfully."));
});
