import mongoose from 'mongoose';
import { Medication } from '../models/medication.model.js';
import { MedicationLog } from '../models/medicationLog.model.js';
import { CareAuditLog } from '../models/careAuditLog.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyCaregiverAccess } from '../middlewares/careCircleAuth.middleware.js';

/**
 * Helper to compute start and end of day in UTC or local context.
 */
const getDayBounds = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Create a new prescription medication.
 */
export const createMedication = async ({
  elderlyUserId,
  medicineName,
  description,
  dosage,
  instructions,
  frequency,
  scheduledTimes,
  startDate,
  endDate,
  prescribedBy,
  status,
  pillAppearance,
  remainingInventory,
  refillThreshold,
  createdBy,
  ipAddress = 'unknown',
}) => {
  // Authorization: Senior themselves or caregiver with manage_medications
  await verifyCaregiverAccess(elderlyUserId, createdBy, 'manage_medications', ipAddress);

  const resident = await User.findById(elderlyUserId);
  if (!resident) {
    throw ApiError.notFound('Elderly resident not found.');
  }

  const medication = await Medication.create({
    elderlyUserId,
    medicineName: medicineName.trim(),
    description: description || '',
    dosage: dosage.trim(),
    instructions: instructions || 'Take with water',
    frequency: frequency || 'daily',
    scheduledTimes,
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : null,
    prescribedBy: prescribedBy || '',
    status: status || 'active',
    pillAppearance: pillAppearance || 'Tablet',
    remainingInventory: remainingInventory !== undefined ? remainingInventory : 30,
    refillThreshold: refillThreshold !== undefined ? refillThreshold : 7,
    createdBy: createdBy._id,
  });

  // Automatically generate today's doses if medication is active
  if (medication.status === 'active') {
    await syncTodayDosesForMedication(medication);
  }

  // Audit Log
  await CareAuditLog.create({
    elderlyUserId,
    performedBy: createdBy._id,
    action: 'RESIDENT_DATA_ACCESSED',
    details: {
      actionType: 'PRESCRIPTION_CREATED',
      medicationId: medication._id,
      medicineName: medication.medicineName,
      dosage: medication.dosage,
    },
    ipAddress,
  });

  return medication;
};

/**
 * Get all medications for an elderly resident.
 */
export const getMedications = async ({ elderlyUserId, status, requester }) => {
  await verifyCaregiverAccess(elderlyUserId, requester, 'view_medications');

  const query = { elderlyUserId };
  if (status) {
    query.status = status;
  }

  const medications = await Medication.find(query).sort({ createdAt: -1 });
  return medications;
};

/**
 * Get a single medication by ID.
 */
export const getMedicationById = async ({ id, requester }) => {
  const medication = await Medication.findById(id);
  if (!medication) {
    throw ApiError.notFound('Medication not found.');
  }

  await verifyCaregiverAccess(medication.elderlyUserId, requester, 'view_medications');
  return medication;
};

/**
 * Update an existing medication without modifying past dose logs.
 */
export const updateMedication = async ({ id, updates, requester, ipAddress = 'unknown' }) => {
  const medication = await Medication.findById(id);
  if (!medication) {
    throw ApiError.notFound('Medication not found.');
  }

  await verifyCaregiverAccess(medication.elderlyUserId, requester, 'manage_medications', ipAddress);

  // Apply updates
  const allowedFields = [
    'medicineName',
    'description',
    'dosage',
    'instructions',
    'frequency',
    'scheduledTimes',
    'startDate',
    'endDate',
    'prescribedBy',
    'status',
    'pillAppearance',
    'remainingInventory',
    'refillThreshold',
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      medication[field] = updates[field];
    }
  }

  await medication.save();

  // If active and scheduledTimes updated, sync today's future doses
  if (medication.status === 'active') {
    await syncTodayDosesForMedication(medication);
  }

  return medication;
};

/**
 * Discontinue / delete a prescription while preserving historical dose logs.
 */
export const deleteMedication = async ({ id, requester, ipAddress = 'unknown' }) => {
  const medication = await Medication.findById(id);
  if (!medication) {
    throw ApiError.notFound('Medication not found.');
  }

  await verifyCaregiverAccess(medication.elderlyUserId, requester, 'manage_medications', ipAddress);

  // Soft-discontinue to preserve historical logs
  medication.status = 'discontinued';
  await medication.save();

  // Cancel any pending doses scheduled in the future for today
  await MedicationLog.deleteMany({
    medicationId: id,
    status: 'pending',
    scheduledAt: { $gt: new Date() },
  });

  return { message: 'Medication discontinued successfully. Historical logs preserved.' };
};

/**
 * Synchronize dose records for a specific medication for today.
 */
const syncTodayDosesForMedication = async (medication, targetDate = new Date()) => {
  const { start, end } = getDayBounds(targetDate);

  // Check if medication is valid for target date
  if (medication.startDate > end) return;
  if (medication.endDate && medication.endDate < start) return;
  if (medication.status !== 'active') return;

  for (const timeStr of medication.scheduledTimes) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const scheduledAt = new Date(targetDate);
    scheduledAt.setHours(hours, minutes, 0, 0);

    // Atomic find-and-create to guarantee no duplicate doses
    await MedicationLog.findOneAndUpdate(
      {
        medicationId: medication._id,
        scheduledAt,
      },
      {
        $setOnInsert: {
          medicationId: medication._id,
          elderlyUserId: medication.elderlyUserId,
          scheduledAt,
          scheduledTimeStr: timeStr,
          status: 'pending',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
};

/**
 * Retrieve today's medication schedule, ensuring all scheduled occurrences are generated.
 */
export const getTodaySchedule = async ({ elderlyUserId, targetDate = new Date(), requester }) => {
  await verifyCaregiverAccess(elderlyUserId, requester, 'view_medications');

  const { start, end } = getDayBounds(targetDate);

  // 1. Fetch active prescriptions for the resident
  const activeMeds = await Medication.find({
    elderlyUserId,
    status: 'active',
    startDate: { $lte: end },
    $or: [{ endDate: null }, { endDate: { $gte: start } }],
  });

  // 2. Ensure dose records exist for each active prescription
  for (const med of activeMeds) {
    await syncTodayDosesForMedication(med, targetDate);
  }

  // 3. Mark past-due pending doses as 'missed' if past scheduled time by 2 hours
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  await MedicationLog.updateMany(
    {
      elderlyUserId,
      status: 'pending',
      scheduledAt: { $lte: twoHoursAgo, $gte: start },
    },
    { $set: { status: 'missed' } }
  );

  // 4. Retrieve all dose records for the day, sorted chronologically
  const doses = await MedicationLog.find({
    elderlyUserId,
    scheduledAt: { $gte: start, $lte: end },
  })
    .populate(
      'medicationId',
      'medicineName description dosage instructions frequency pillAppearance remainingInventory prescribedBy'
    )
    .populate('confirmedBy', 'name role')
    .sort({ scheduledAt: 1 });

  return doses;
};

/**
 * Confirm a medication dose as taken.
 */
export const confirmDoseTaken = async ({
  doseId,
  requester,
  notes = '',
  ipAddress = 'unknown',
}) => {
  const dose = await MedicationLog.findById(doseId).populate('medicationId');
  if (!dose) {
    throw ApiError.notFound('Medication dose record not found.');
  }

  // Authorization: Senior themselves or caregiver with manage_medications
  await verifyCaregiverAccess(dose.elderlyUserId, requester, 'manage_medications', ipAddress);

  // Edge case: duplicate confirmation prevention
  if (dose.status === 'taken') {
    throw ApiError.badRequest('This medication dose has already been confirmed as taken.');
  }

  dose.status = 'taken';
  dose.confirmedAt = new Date();
  dose.confirmedBy = requester._id;
  if (notes) dose.notes = notes.trim();
  await dose.save();

  // Deduct 1 from inventory if available
  if (dose.medicationId && dose.medicationId.remainingInventory > 0) {
    await Medication.findByIdAndUpdate(dose.medicationId._id, {
      $inc: { remainingInventory: -1 },
    });
  }

  // Audit Log
  await CareAuditLog.create({
    elderlyUserId: dose.elderlyUserId,
    performedBy: requester._id,
    action: 'RESIDENT_DATA_ACCESSED',
    details: {
      actionType: 'DOSE_TAKEN_CONFIRMED',
      doseId: dose._id,
      medicationName: dose.medicationId?.medicineName,
      scheduledAt: dose.scheduledAt,
    },
    ipAddress,
  });

  return dose;
};

/**
 * Mark a medication dose as skipped with a clinical reason.
 */
export const skipDose = async ({
  doseId,
  requester,
  notes = 'Skipped by caregiver',
  ipAddress = 'unknown',
}) => {
  const dose = await MedicationLog.findById(doseId).populate('medicationId');
  if (!dose) {
    throw ApiError.notFound('Medication dose record not found.');
  }

  await verifyCaregiverAccess(dose.elderlyUserId, requester, 'manage_medications', ipAddress);

  if (dose.status === 'taken') {
    throw ApiError.badRequest('Cannot skip a medication dose that was already confirmed as taken.');
  }

  dose.status = 'skipped';
  dose.confirmedAt = new Date();
  dose.confirmedBy = requester._id;
  dose.notes = notes.trim();
  await dose.save();

  return dose;
};

/**
 * Retrieve medication dose log history with pagination and filters.
 */
export const getMedicationHistory = async ({
  elderlyUserId,
  requester,
  startDate,
  endDate,
  status,
  medicationId,
  limit = 50,
  page = 1,
}) => {
  await verifyCaregiverAccess(elderlyUserId, requester, 'view_medications');

  const query = { elderlyUserId };

  if (status) query.status = status;
  if (medicationId) query.medicationId = medicationId;

  if (startDate || endDate) {
    query.scheduledAt = {};
    if (startDate) query.scheduledAt.$gte = new Date(startDate);
    if (endDate) query.scheduledAt.$lte = new Date(endDate);
  }

  const skip = (Math.max(1, page) - 1) * limit;

  const [doses, total] = await Promise.all([
    MedicationLog.find(query)
      .populate('medicationId', 'medicineName dosage pillAppearance')
      .populate('confirmedBy', 'name role')
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    MedicationLog.countDocuments(query),
  ]);

  return {
    doses,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Compute adherence metrics for an elderly resident.
 */
export const getAdherenceStats = async ({ elderlyUserId, requester, days = 7 }) => {
  await verifyCaregiverAccess(elderlyUserId, requester, 'view_medications');

  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const logs = await MedicationLog.find({
    elderlyUserId,
    scheduledAt: { $gte: sinceDate },
  });

  const total = logs.length;
  const taken = logs.filter((l) => l.status === 'taken').length;
  const skipped = logs.filter((l) => l.status === 'skipped').length;
  const missed = logs.filter((l) => l.status === 'missed').length;
  const pending = logs.filter((l) => l.status === 'pending').length;

  const denominator = total - pending;
  const adherenceRate = denominator > 0 ? Math.round((taken / denominator) * 100) : 100;

  return {
    daysAnalyzed: days,
    totalScheduled: total,
    takenCount: taken,
    skippedCount: skipped,
    missedCount: missed,
    pendingCount: pending,
    adherenceRate, // Percentage 0 - 100
  };
};

export default {
  createMedication,
  getMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
  getTodaySchedule,
  confirmDoseTaken,
  skipDose,
  getMedicationHistory,
  getAdherenceStats,
};
