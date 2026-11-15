import { Appointment } from '../models/appointment.model.js';
import { Medication } from '../models/medication.model.js';
import { HealthObservation } from '../models/healthObservation.model.js';
import { CareRelationship } from '../models/careRelationship.model.js';
import { Notification } from '../models/notification.model.js';
import { CareAuditLog } from '../models/careAuditLog.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyCaregiverAccess } from '../middlewares/careCircleAuth.middleware.js';
import { sendNotification } from './notification.service.js';

/**
 * Detect scheduling conflicts for an elderly resident.
 * An overlap occurs when: existing.start < new.end AND existing.end > new.start.
 */
export const checkAppointmentConflict = async ({
  elderlyUserId,
  appointmentDate,
  durationMinutes = 45,
  excludeId = null,
}) => {
  const newStart = new Date(appointmentDate).getTime();
  const newEnd = newStart + durationMinutes * 60 * 1000;

  // Search window: within 4 hours around the new appointment
  const searchStart = new Date(newStart - 4 * 60 * 60 * 1000);
  const searchEnd = new Date(newEnd + 4 * 60 * 60 * 1000);

  const query = {
    elderlyUserId,
    status: { $in: ['upcoming', 'rescheduled'] },
    appointmentDate: { $gte: searchStart, $lte: searchEnd },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingAppointments = await Appointment.find(query);

  for (const existing of existingAppointments) {
    const existingStart = new Date(existing.appointmentDate).getTime();
    const existingDuration = existing.durationMinutes || 45;
    const existingEnd = existingStart + existingDuration * 60 * 1000;

    // Check overlap
    if (existingStart < newEnd && existingEnd > newStart) {
      const conflictTimeStr = existing.timeStr || existing.appointmentTime || new Date(existingStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        hasConflict: true,
        conflictingAppointment: existing,
        message: `Appointment conflict: Already scheduled with ${existing.doctorName} (${existing.specialty || 'General'}) at ${conflictTimeStr} on this date.`,
      };
    }
  }

  return { hasConflict: false };
};

/**
 * Create a new doctor appointment with permission enforcement & conflict checking.
 */
export const createAppointment = async ({
  elderlyUserId,
  doctorName,
  specialty = 'General Practice',
  hospitalName = '',
  clinicName = '',
  location = '',
  appointmentDate,
  appointmentTime = '',
  timeStr = '',
  durationMinutes = 45,
  reason = 'Routine Geriatric Consultation',
  type = 'checkup',
  phone = '',
  isTelehealth = false,
  telehealthLink = '',
  notes = '',
  questionsForDoctor = [],
  requester,
  ipAddress = 'unknown',
}) => {
  if (!elderlyUserId) throw ApiError.badRequest('Elderly resident ID is required.');
  if (!doctorName) throw ApiError.badRequest('Doctor or specialist name is required.');
  if (!appointmentDate) throw ApiError.badRequest('Appointment date is required.');

  // 1. Permission check: Senior themselves, admin, or caregiver/family with manage_appointments
  await verifyCaregiverAccess(elderlyUserId, requester, 'manage_appointments', ipAddress);

  const parsedDate = new Date(appointmentDate);
  if (isNaN(parsedDate.getTime())) {
    throw ApiError.badRequest('Invalid appointment date format.');
  }

  // 2. Conflict checking
  const conflict = await checkAppointmentConflict({
    elderlyUserId,
    appointmentDate: parsedDate,
    durationMinutes,
  });

  if (conflict.hasConflict) {
    throw ApiError.conflict(conflict.message);
  }

  const resolvedClinic = hospitalName || clinicName || 'Medical Center';
  const resolvedTime = appointmentTime || timeStr || parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 3. Create appointment
  const appointment = await Appointment.create({
    elderlyUserId,
    doctorName: doctorName.trim(),
    specialty: specialty.trim(),
    hospitalName: resolvedClinic,
    clinicName: resolvedClinic,
    location: location.trim(),
    appointmentDate: parsedDate,
    appointmentTime: resolvedTime,
    timeStr: resolvedTime,
    durationMinutes,
    reason: reason.trim(),
    type,
    phone: phone.trim(),
    isTelehealth: Boolean(isTelehealth),
    telehealthLink: telehealthLink.trim(),
    notes: notes.trim(),
    questionsForDoctor: Array.isArray(questionsForDoctor)
      ? questionsForDoctor.map((q) => (typeof q === 'string' ? { question: q } : q))
      : [],
    createdBy: requester._id,
    status: 'upcoming',
  });

  // 4. Audit Log
  await CareAuditLog.create({
    elderlyUserId,
    performedBy: requester._id,
    action: 'APPOINTMENT_SCHEDULED',
    details: {
      appointmentId: appointment._id,
      doctorName: appointment.doctorName,
      specialty: appointment.specialty,
      appointmentDate: appointment.appointmentDate,
      timeStr: appointment.timeStr,
      isTelehealth: appointment.isTelehealth,
    },
    ipAddress,
  });

  return appointment;
};

/**
 * Update an existing appointment with conflict re-validation.
 */
export const updateAppointment = async ({
  id,
  updates,
  requester,
  ipAddress = 'unknown',
}) => {
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw ApiError.notFound('Appointment not found.');
  }

  // Verify management permission
  await verifyCaregiverAccess(appointment.elderlyUserId, requester, 'manage_appointments', ipAddress);

  // If date, time, or duration is changing, re-validate conflicts
  const newDate = updates.appointmentDate ? new Date(updates.appointmentDate) : appointment.appointmentDate;
  const newDuration = updates.durationMinutes || appointment.durationMinutes || 45;

  if (
    updates.appointmentDate &&
    new Date(updates.appointmentDate).getTime() !== new Date(appointment.appointmentDate).getTime()
  ) {
    const conflict = await checkAppointmentConflict({
      elderlyUserId: appointment.elderlyUserId,
      appointmentDate: newDate,
      durationMinutes: newDuration,
      excludeId: appointment._id,
    });

    if (conflict.hasConflict) {
      throw ApiError.conflict(conflict.message);
    }

    // Reset reminders if rescheduled to the future
    appointment.reminderSent24h = false;
    appointment.reminderSent2h = false;
  }

  const allowedFields = [
    'doctorName',
    'specialty',
    'hospitalName',
    'clinicName',
    'location',
    'appointmentDate',
    'appointmentTime',
    'timeStr',
    'durationMinutes',
    'reason',
    'type',
    'status',
    'phone',
    'isTelehealth',
    'telehealthLink',
    'notes',
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      appointment[field] = updates[field];
    }
  }

  // Synchronize aliases
  if (updates.hospitalName) appointment.clinicName = updates.hospitalName;
  if (updates.clinicName) appointment.hospitalName = updates.clinicName;
  if (updates.appointmentTime) appointment.timeStr = updates.appointmentTime;
  if (updates.timeStr) appointment.appointmentTime = updates.timeStr;

  await appointment.save();
  return appointment;
};

/**
 * Cancel an appointment safely.
 */
export const cancelAppointment = async ({ id, reason = '', requester, ipAddress = 'unknown' }) => {
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw ApiError.notFound('Appointment not found.');
  }

  await verifyCaregiverAccess(appointment.elderlyUserId, requester, 'manage_appointments', ipAddress);

  appointment.status = 'cancelled';
  if (reason) {
    appointment.notes = appointment.notes
      ? `${appointment.notes}\n[Cancellation Reason: ${reason}]`
      : `Cancellation Reason: ${reason}`;
  }
  await appointment.save();

  return appointment;
};

/**
 * Retrieve appointments with filters (upcoming, past, calendar date range).
 */
export const getAppointments = async ({
  elderlyUserId,
  status = 'all', // 'upcoming' | 'past' | 'all'
  startDate,
  endDate,
  requester,
}) => {
  if (!elderlyUserId) throw ApiError.badRequest('Elderly resident ID is required.');

  // Verify view permission
  await verifyCaregiverAccess(elderlyUserId, requester, 'view_appointments');

  const now = new Date();
  const query = { elderlyUserId };

  if (status === 'upcoming') {
    query.appointmentDate = { $gte: now };
    query.status = { $ne: 'cancelled' };
  } else if (status === 'past') {
    query.$or = [{ appointmentDate: { $lt: now } }, { status: 'completed' }];
  } else if (status === 'cancelled') {
    query.status = 'cancelled';
  }

  if (startDate || endDate) {
    query.appointmentDate = query.appointmentDate || {};
    if (startDate) query.appointmentDate.$gte = new Date(startDate);
    if (endDate) query.appointmentDate.$lte = new Date(endDate);
  }

  const sortDirection = status === 'past' ? -1 : 1;
  const appointments = await Appointment.find(query)
    .populate('elderlyUserId', 'name profileImage timezone')
    .populate('createdBy', 'name role')
    .sort({ appointmentDate: sortDirection });

  return appointments;
};

/**
 * Retrieve single appointment details.
 */
export const getAppointmentById = async ({ id, requester }) => {
  const appointment = await Appointment.findById(id)
    .populate('elderlyUserId', 'name email phone profileImage timezone emergencyContact roomNumber')
    .populate('createdBy', 'name role');

  if (!appointment) {
    throw ApiError.notFound('Appointment not found.');
  }

  await verifyCaregiverAccess(appointment.elderlyUserId._id, requester, 'view_appointments');
  return appointment;
};

/**
 * Add a family-provided question to an appointment.
 */
export const addQuestionToAppointment = async ({
  appointmentId,
  question,
  requester,
}) => {
  if (!question || !question.trim()) {
    throw ApiError.badRequest('Question text is required.');
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw ApiError.notFound('Appointment not found.');
  }

  // Anyone with view_appointments or manage_appointments can add questions
  await verifyCaregiverAccess(appointment.elderlyUserId, requester, 'view_appointments');

  const questionObj = {
    question: question.trim(),
    addedBy: requester._id,
    addedByName: requester.name || 'Family Member',
    createdAt: new Date(),
    isAnswered: false,
    doctorResponse: '',
  };

  appointment.questionsForDoctor.push(questionObj);
  await appointment.save();

  return appointment;
};

/**
 * Generate a comprehensive Doctor Preparation Summary combining:
 * 1. Appointment Information (Doctor, Hospital/Clinic, Date, Time, Reason).
 * 2. Authorized Active Medications (Names, dosages, schedules, instructions).
 * 3. Recent Health Observations (BP, glucose, heart rate, oxygen trends over last 14 days).
 * 4. Family-Provided Questions for the doctor.
 * 5. Resident Profile & Emergency Contacts.
 */
export const getPreparationSummary = async ({ appointmentId, requester }) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate('elderlyUserId', 'name email phone profileImage timezone emergencyContact roomNumber')
    .populate('createdBy', 'name role');

  if (!appointment) {
    throw ApiError.notFound('Appointment not found.');
  }

  const elderlyId = appointment.elderlyUserId._id;
  await verifyCaregiverAccess(elderlyId, requester, 'view_appointments');

  // 1. Fetch active prescriptions
  const activeMedications = await Medication.find({
    elderlyUserId: elderlyId,
    status: 'active',
  }).select('medicineName dosage instructions frequency scheduledTimes remainingInventory prescribedBy');

  // 2. Fetch recent health observations (last 14 days)
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const recentObservations = await HealthObservation.find({
    elderlyUserId: elderlyId,
    recordedAt: { $gte: fourteenDaysAgo },
  })
    .populate('recordedBy', 'name role')
    .sort({ recordedAt: -1 })
    .limit(15);

  // 3. Fetch Care Circle contacts for emergency / consultation backup
  const circleMembers = await CareRelationship.find({
    elderlyUserId: elderlyId,
    invitationStatus: 'accepted',
  }).populate('memberUserId', 'name email phone role');

  const careContacts = circleMembers
    .filter((cm) => cm.memberUserId)
    .map((cm) => ({
      name: cm.memberUserId.name,
      role: cm.memberUserId.role,
      relationship: cm.relationshipType,
      phone: cm.memberUserId.phone || 'N/A',
    }));

  return {
    appointment: {
      id: appointment._id,
      doctorName: appointment.doctorName,
      specialty: appointment.specialty,
      hospitalName: appointment.hospitalName || appointment.clinicName,
      clinicName: appointment.clinicName || appointment.hospitalName,
      location: appointment.location,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime || appointment.timeStr,
      timeStr: appointment.timeStr || appointment.appointmentTime,
      durationMinutes: appointment.durationMinutes || 45,
      reason: appointment.reason,
      status: appointment.status,
      isTelehealth: appointment.isTelehealth,
      telehealthLink: appointment.telehealthLink,
      notes: appointment.notes,
      questionsForDoctor: appointment.questionsForDoctor || [],
    },
    resident: {
      id: appointment.elderlyUserId._id,
      name: appointment.elderlyUserId.name,
      phone: appointment.elderlyUserId.phone,
      profileImage: appointment.elderlyUserId.profileImage,
      roomNumber: appointment.elderlyUserId.roomNumber || 'Private Suite',
      timezone: appointment.elderlyUserId.timezone || 'UTC',
    },
    activeMedications,
    recentObservations,
    careContacts,
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Appointment Reminder Scheduler:
 * Dispatches 24-hour and 2-hour notifications for upcoming doctor visits.
 */
export const checkUpcomingAppointmentReminders = async () => {
  const now = new Date();
  const dispatchedReminders = [];

  // --- A. 24-Hour Reminders ---
  const window24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const upcoming24h = await Appointment.find({
    status: 'upcoming',
    reminderSent24h: false,
    appointmentDate: { $gte: now, $lte: window24h },
  }).populate('elderlyUserId', 'name email timezone');

  for (const appt of upcoming24h) {
    const elderly = appt.elderlyUserId;
    if (!elderly) continue;

    const timeFormatted = appt.timeStr || appt.appointmentTime || new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const title = `Tomorrow: Appointment with ${appt.doctorName}`;
    const message = `Reminder: ${elderly.name} has a scheduled ${appt.specialty} visit tomorrow at ${timeFormatted} with ${appt.doctorName} at ${appt.hospitalName || appt.clinicName || 'Clinic'}.`;

    // 1. Notify the senior
    await sendNotification({
      recipientId: elderly._id,
      elderlyUserId: elderly._id,
      type: 'appointment_reminder',
      title,
      message,
      relatedEntityId: appt._id,
    });

    // 2. Notify authorized CareCircle caregivers & family with view_appointments
    const relationships = await CareRelationship.find({
      elderlyUserId: elderly._id,
      invitationStatus: 'accepted',
      permissions: 'view_appointments',
    });

    for (const rel of relationships) {
      if (rel.memberUserId) {
        await sendNotification({
          recipientId: rel.memberUserId,
          elderlyUserId: elderly._id,
          type: 'appointment_reminder',
          title,
          message,
          relatedEntityId: appt._id,
        });
      }
    }

    appt.reminderSent24h = true;
    await appt.save();
    dispatchedReminders.push({ appointmentId: appt._id, window: '24h', doctorName: appt.doctorName });
  }

  // --- B. 2-Hour Reminders ---
  const window2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const upcoming2h = await Appointment.find({
    status: 'upcoming',
    reminderSent2h: false,
    appointmentDate: { $gte: now, $lte: window2h },
  }).populate('elderlyUserId', 'name email timezone');

  for (const appt of upcoming2h) {
    const elderly = appt.elderlyUserId;
    if (!elderly) continue;

    const timeFormatted = appt.timeStr || appt.appointmentTime || new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const title = `In 2 Hours: Visit with ${appt.doctorName}`;
    const message = `Upcoming Visit: ${elderly.name} meets with ${appt.doctorName} (${appt.specialty}) in 2 hours at ${timeFormatted}.`;

    await sendNotification({
      recipientId: elderly._id,
      elderlyUserId: elderly._id,
      type: 'appointment_reminder',
      title,
      message,
      relatedEntityId: appt._id,
    });

    const relationships = await CareRelationship.find({
      elderlyUserId: elderly._id,
      invitationStatus: 'accepted',
      permissions: 'view_appointments',
    });

    for (const rel of relationships) {
      if (rel.memberUserId) {
        await sendNotification({
          recipientId: rel.memberUserId,
          elderlyUserId: elderly._id,
          type: 'appointment_reminder',
          title,
          message,
          relatedEntityId: appt._id,
        });
      }
    }

    appt.reminderSent2h = true;
    await appt.save();
    dispatchedReminders.push({ appointmentId: appt._id, window: '2h', doctorName: appt.doctorName });
  }

  return dispatchedReminders;
};
