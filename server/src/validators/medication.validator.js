import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { FREQUENCY_TYPES, MEDICATION_STATUSES } from '../models/medication.model.js';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const validateCreateMedication = (req, res, next) => {
  const {
    elderlyUserId,
    medicineName,
    dosage,
    frequency,
    scheduledTimes,
    startDate,
    endDate,
    status,
  } = req.body;

  const errors = [];

  if (!elderlyUserId || !mongoose.Types.ObjectId.isValid(elderlyUserId)) {
    errors.push('A valid elderly resident user ID is required.');
  }

  if (!medicineName || typeof medicineName !== 'string' || medicineName.trim().length < 2) {
    errors.push('Medicine name is required and must be at least 2 characters.');
  }

  if (!dosage || typeof dosage !== 'string' || dosage.trim().length === 0) {
    errors.push('Dosage instructions (e.g. "10mg", "1 tablet") are required.');
  }

  if (frequency && !FREQUENCY_TYPES.includes(frequency)) {
    errors.push(`Invalid frequency. Allowed: ${FREQUENCY_TYPES.join(', ')}.`);
  }

  if (!scheduledTimes || !Array.isArray(scheduledTimes) || scheduledTimes.length === 0) {
    errors.push('At least one scheduled time (HH:mm) is required.');
  } else {
    for (const t of scheduledTimes) {
      if (!timeRegex.test(t)) {
        errors.push(`Invalid scheduled time format '${t}'. Must be HH:mm (e.g. "08:00", "20:30").`);
      }
    }
  }

  if (startDate && isNaN(new Date(startDate).getTime())) {
    errors.push('Invalid start date provided.');
  }

  if (endDate) {
    if (isNaN(new Date(endDate).getTime())) {
      errors.push('Invalid end date provided.');
    } else if (startDate && new Date(endDate) <= new Date(startDate)) {
      errors.push('End date must be after the start date.');
    }
  }

  if (status && !MEDICATION_STATUSES.includes(status)) {
    errors.push(`Invalid status. Allowed: ${MEDICATION_STATUSES.join(', ')}.`);
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Medication creation validation failed.', errors));
  }

  next();
};

export const validateUpdateMedication = (req, res, next) => {
  const { scheduledTimes, frequency, status, startDate, endDate } = req.body;
  const errors = [];

  if (scheduledTimes) {
    if (!Array.isArray(scheduledTimes) || scheduledTimes.length === 0) {
      errors.push('Scheduled times must be a non-empty array of HH:mm strings.');
    } else {
      for (const t of scheduledTimes) {
        if (!timeRegex.test(t)) {
          errors.push(`Invalid scheduled time format '${t}'. Must be HH:mm.`);
        }
      }
    }
  }

  if (frequency && !FREQUENCY_TYPES.includes(frequency)) {
    errors.push(`Invalid frequency. Allowed: ${FREQUENCY_TYPES.join(', ')}.`);
  }

  if (status && !MEDICATION_STATUSES.includes(status)) {
    errors.push(`Invalid status. Allowed: ${MEDICATION_STATUSES.join(', ')}.`);
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Medication update validation failed.', errors));
  }

  next();
};

export default {
  validateCreateMedication,
  validateUpdateMedication,
};
