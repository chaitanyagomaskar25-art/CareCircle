import { CareRelationship } from '../models/careRelationship.model.js';
import { CareAuditLog } from '../models/careAuditLog.model.js';
import { Medication } from '../models/medication.model.js';
import { MedicationLog } from '../models/medicationLog.model.js';
import { Notification } from '../models/notification.model.js';
import { HealthObservation } from '../models/healthObservation.model.js';
import { Appointment } from '../models/appointment.model.js';
import { CareNote } from '../models/careNote.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyCaregiverAccess } from '../middlewares/careCircleAuth.middleware.js';
import { getTodaySchedule, getAdherenceStats } from './medication.service.js';

/**
 * Get comprehensive overview for a caregiver across only the elderly residents who explicitly authorized access.
 */
export const getCaregiverDashboardOverview = async (caregiverUser) => {
  // 1. Fetch only explicitly authorized Care Circle relationships
  let relationships = [];
  if (caregiverUser.role === 'admin') {
    // Admin can see all elderly users
    const seniors = await User.find({ role: 'elderly', accountStatus: 'active' });
    relationships = seniors.map((s) => ({
      elderlyUserId: s,
      relationshipType: 'admin_oversight',
      permissions: [
        'view_medications',
        'manage_medications',
        'view_appointments',
        'manage_appointments',
        'view_health_records',
        'add_health_observations',
      ],
      invitationStatus: 'accepted',
    }));
  } else {
    relationships = await CareRelationship.find({
      memberUserId: caregiverUser._id,
      invitationStatus: 'accepted',
    }).populate('elderlyUserId', 'name email phone profileImage accountStatus timezone');
  }

  // Filter out any where elderly user was deleted
  relationships = relationships.filter((r) => r.elderlyUserId && r.elderlyUserId._id);
  const authorizedElderlyIds = relationships.map((r) => r.elderlyUserId._id);

  if (authorizedElderlyIds.length === 0) {
    return {
      assignedResidents: [],
      metrics: {
        totalResidents: 0,
        todayTotalDoses: 0,
        todayPendingDoses: 0,
        todayMissedDoses: 0,
        todayTakenDoses: 0,
        averageAdherenceRate: 100,
        upcomingAppointmentsCount: 0,
      },
      todayActionDoses: [],
      upcomingAppointments: [],
      recentObservations: [],
      recentNotifications: [],
      activityTimeline: [],
    };
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // 2. Fetch today's dose logs for authorized residents
  const todayDoses = await MedicationLog.find({
    elderlyUserId: { $in: authorizedElderlyIds },
    scheduledAt: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate('medicationId', 'medicineName dosage instructions pillAppearance')
    .populate('elderlyUserId', 'name profileImage')
    .sort({ scheduledAt: 1 });

  const pendingDoses = todayDoses.filter((d) => d.status === 'pending');
  const missedDoses = todayDoses.filter((d) => d.status === 'missed');
  const takenDoses = todayDoses.filter((d) => d.status === 'taken');

  // Overdue and pending action items for caregiver (calm priority list)
  const todayActionDoses = todayDoses.map((d) => ({
    id: d._id,
    _id: d._id,
    residentId: d.elderlyUserId?._id,
    residentName: d.elderlyUserId?.name || 'Resident',
    residentAvatar: d.elderlyUserId?.profileImage,
    medicineName: d.medicationId?.medicineName || 'Medication',
    dosage: d.medicationId?.dosage || '',
    instructions: d.medicationId?.instructions || '',
    scheduledTimeStr: d.scheduledTimeStr || new Date(d.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    scheduledAt: d.scheduledAt,
    status: d.status,
    confirmedAt: d.confirmedAt,
    confirmedBy: d.confirmedBy,
    notes: d.notes,
  }));

  // 3. Resident Cards with individual adherence & status
  const assignedResidents = await Promise.all(
    relationships.map(async (rel) => {
      const senior = rel.elderlyUserId;
      const seniorId = senior._id;

      // Adherence stats for this senior
      const adherence = await getAdherenceStats({
        elderlyUserId: seniorId,
        requester: caregiverUser,
        days: 7,
      });

      // Dose counts for today
      const seniorDoses = todayDoses.filter(
        (d) => d.elderlyUserId?._id.toString() === seniorId.toString()
      );
      const seniorPending = seniorDoses.filter((d) => d.status === 'pending').length;
      const seniorMissed = seniorDoses.filter((d) => d.status === 'missed').length;

      // Active prescriptions
      const activePrescriptionsCount = await Medication.countDocuments({
        elderlyUserId: seniorId,
        status: 'active',
      });

      return {
        id: seniorId,
        _id: seniorId,
        name: senior.name,
        email: senior.email,
        phone: senior.phone,
        profileImage: senior.profileImage,
        relationshipType: rel.relationshipType,
        permissions: rel.permissions,
        activePrescriptionsCount,
        todayPending: seniorPending,
        todayMissed: seniorMissed,
        adherenceRate: adherence.adherenceRate,
      };
    })
  );

  // 4. Upcoming appointments across assigned seniors (next 14 days)
  const upcomingAppointments = await Appointment.find({
    elderlyUserId: { $in: authorizedElderlyIds },
    appointmentDate: { $gte: now },
    status: 'upcoming',
  })
    .populate('elderlyUserId', 'name profileImage')
    .sort({ appointmentDate: 1 })
    .limit(10);

  // 5. Recent health observations across assigned seniors
  const recentObservations = await HealthObservation.find({
    elderlyUserId: { $in: authorizedElderlyIds },
  })
    .populate('elderlyUserId', 'name profileImage')
    .populate('recordedBy', 'name role')
    .sort({ recordedAt: -1 })
    .limit(8);

  // 6. Recent notifications for this caregiver
  const recentNotifications = await Notification.find({
    recipientId: caregiverUser._id,
  })
    .populate('elderlyUserId', 'name')
    .sort({ sentAt: -1 })
    .limit(6);

  // 7. Care activity timeline (recent dose confirmations + audit events)
  const recentAuditLogs = await CareAuditLog.find({
    elderlyUserId: { $in: authorizedElderlyIds },
  })
    .populate('elderlyUserId', 'name')
    .populate('performedBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(10);

  // Compute overall average adherence
  const totalAdherence = assignedResidents.reduce((acc, r) => acc + r.adherenceRate, 0);
  const averageAdherenceRate =
    assignedResidents.length > 0 ? Math.round(totalAdherence / assignedResidents.length) : 100;

  return {
    assignedResidents,
    metrics: {
      totalResidents: assignedResidents.length,
      todayTotalDoses: todayDoses.length,
      todayPendingDoses: pendingDoses.length,
      todayMissedDoses: missedDoses.length,
      todayTakenDoses: takenDoses.length,
      averageAdherenceRate,
      upcomingAppointmentsCount: upcomingAppointments.length,
    },
    todayActionDoses,
    upcomingAppointments,
    recentObservations,
    recentNotifications,
    activityTimeline: recentAuditLogs,
  };
};

/**
 * Get detailed individual care overview for a single elderly individual.
 * Requires explicit relationship permission verification.
 */
export const getCaregiverElderlyDetail = async ({
  elderlyId,
  caregiverUser,
  filters = {},
  ipAddress = 'unknown',
}) => {
  // Explicit permission verification
  const relationship = await verifyCaregiverAccess(
    elderlyId,
    caregiverUser,
    'view_medications',
    ipAddress
  );

  const elderlyUser = await User.findById(elderlyId);
  if (!elderlyUser) {
    throw ApiError.notFound('Elderly resident not found.');
  }

  // 1. Care Circle Contacts (Family & Caregiver Team)
  const careCircleMembers = await CareRelationship.find({
    elderlyUserId: elderlyId,
    invitationStatus: 'accepted',
  }).populate('memberUserId', 'name email phone role profileImage');

  // 2. Today's Medication Schedule
  const todaySchedule = await getTodaySchedule({
    elderlyUserId: elderlyId,
    requester: caregiverUser,
  });

  // 3. Medication History with Filters (status, dateRange)
  const historyQuery = { elderlyUserId: elderlyId };
  if (filters.status && filters.status !== 'all') {
    historyQuery.status = filters.status;
  }
  if (filters.startDate || filters.endDate) {
    historyQuery.scheduledAt = {};
    if (filters.startDate) historyQuery.scheduledAt.$gte = new Date(filters.startDate);
    if (filters.endDate) historyQuery.scheduledAt.$lte = new Date(filters.endDate);
  }

  const medicationHistory = await MedicationLog.find(historyQuery)
    .populate('medicationId', 'medicineName dosage instructions')
    .populate('confirmedBy', 'name role')
    .sort({ scheduledAt: -1 })
    .limit(50);

  // 4. Appointments Schedule
  const appointmentQuery = { elderlyUserId: elderlyId };
  const appointments = await Appointment.find(appointmentQuery)
    .populate('createdBy', 'name')
    .sort({ appointmentDate: 1 });

  // 5. Health Observations
  const observations = await HealthObservation.find({ elderlyUserId: elderlyId })
    .populate('recordedBy', 'name role')
    .sort({ recordedAt: -1 })
    .limit(20);

  // 6. Care Notes
  const careNotes = await CareNote.find({ elderlyUserId: elderlyId })
    .populate('authorId', 'name role')
    .sort({ createdAt: -1 })
    .limit(20);

  // 7. Adherence Analytics
  const adherence = await getAdherenceStats({
    elderlyUserId: elderlyId,
    requester: caregiverUser,
    days: 7,
  });

  // 8. Active Prescriptions
  const activePrescriptions = await Medication.find({
    elderlyUserId: elderlyId,
  }).sort({ createdAt: -1 });

  return {
    resident: {
      id: elderlyUser._id,
      _id: elderlyUser._id,
      name: elderlyUser.name,
      email: elderlyUser.email,
      phone: elderlyUser.phone,
      profileImage: elderlyUser.profileImage,
      accountStatus: elderlyUser.accountStatus,
      timezone: elderlyUser.timezone || 'UTC',
    },
    authorizedPermissions: relationship ? relationship.permissions : ['full_admin_access'],
    relationshipType: relationship ? relationship.relationshipType : 'self_or_admin',
    careCircleMembers,
    todaySchedule,
    medicationHistory,
    appointments,
    observations,
    careNotes,
    adherence,
    activePrescriptions,
  };
};

/**
 * Record a new clinical health observation.
 */
export const recordHealthObservation = async ({
  elderlyUserId,
  author,
  type,
  title,
  value,
  numericValue,
  unit,
  severity,
  notes,
  ipAddress = 'unknown',
}) => {
  await verifyCaregiverAccess(elderlyUserId, author, 'add_health_observations', ipAddress);

  const observation = await HealthObservation.create({
    elderlyUserId,
    recordedBy: author._id,
    metricType: type,
    type,
    title,
    value,
    numericValue: numericValue ? Number(numericValue) : null,
    unit: unit || '',
    severity: severity || 'normal',
    recordSource: 'manual',
    notes: notes || '',
    recordedAt: new Date(),
  });

  // Audit
  await CareAuditLog.create({
    elderlyUserId,
    performedBy: author._id,
    action: 'HEALTH_OBSERVATION_RECORDED',
    details: { observationId: observation._id, type, value, severity },
    ipAddress,
  });

  return observation;
};

/**
 * Record a new care note.
 */
export const recordCareNote = async ({
  elderlyUserId,
  author,
  category,
  note,
  isPriority,
  ipAddress = 'unknown',
}) => {
  await verifyCaregiverAccess(elderlyUserId, author, 'view_medications', ipAddress);

  const careNote = await CareNote.create({
    elderlyUserId,
    authorId: author._id,
    category: category || 'general',
    note,
    isPriority: Boolean(isPriority),
  });

  return careNote;
};

/**
 * Schedule a doctor or healthcare appointment.
 */
export const scheduleAppointment = async ({
  elderlyUserId,
  author,
  doctorName,
  specialty,
  clinicName,
  location,
  appointmentDate,
  timeStr,
  type,
  phone,
  isTelehealth,
  telehealthLink,
  notes,
  ipAddress = 'unknown',
}) => {
  await verifyCaregiverAccess(elderlyUserId, author, 'manage_appointments', ipAddress);

  const appointment = await Appointment.create({
    elderlyUserId,
    doctorName,
    specialty: specialty || 'General Care',
    clinicName: clinicName || '',
    location: location || '',
    appointmentDate: new Date(appointmentDate),
    timeStr: timeStr || '',
    type: type || 'checkup',
    phone: phone || '',
    isTelehealth: Boolean(isTelehealth),
    telehealthLink: telehealthLink || '',
    notes: notes || '',
    createdBy: author._id,
  });

  // Audit
  await CareAuditLog.create({
    elderlyUserId,
    performedBy: author._id,
    action: 'APPOINTMENT_SCHEDULED',
    details: { appointmentId: appointment._id, doctorName, appointmentDate },
    ipAddress,
  });

  return appointment;
};

export default {
  getCaregiverDashboardOverview,
  getCaregiverElderlyDetail,
  recordHealthObservation,
  recordCareNote,
  scheduleAppointment,
};
