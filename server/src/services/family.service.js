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
 * Helper to compute date range filter bounds.
 */
const getDateRangeFilter = (dateRange) => {
  const now = new Date();
  if (dateRange === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { $gte: start };
  } else if (dateRange === '7days') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { $gte: start };
  } else if (dateRange === '30days') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { $gte: start };
  }
  return null;
};

/**
 * Get comprehensive overview for a family member for all elderly relatives they are authorized to support.
 */
export const getFamilyDashboardOverview = async (familyUser) => {
  // 1. Fetch only explicitly authorized Care Circle relationships
  let relationships = [];
  if (familyUser.role === 'admin') {
    const seniors = await User.find({ role: 'elderly', accountStatus: 'active' });
    relationships = seniors.map((s) => ({
      elderlyUserId: s,
      relationshipType: 'family',
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
      memberUserId: familyUser._id,
      invitationStatus: 'accepted',
    }).populate('elderlyUserId', 'name email phone profileImage accountStatus timezone');
  }

  // Filter out any where elderly user was removed or inactive
  relationships = relationships.filter((r) => r.elderlyUserId && r.elderlyUserId._id);
  const authorizedElderlyIds = relationships.map((r) => r.elderlyUserId._id);

  if (authorizedElderlyIds.length === 0) {
    return {
      authorizedResidents: [],
      metrics: {
        totalSupportedSeniors: 0,
        todayAdherenceRate: 100,
        overall7DayAdherence: 100,
        totalPendingDosesToday: 0,
        totalMissedDosesToday: 0,
        upcomingAppointmentsCount: 0,
        unreadAlertsCount: 0,
      },
      missedDoseAlerts: [],
      activityFeed: [],
      upcomingAppointments: [],
      recentObservations: [],
      emergencyContacts: [],
    };
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // 2. Fetch data per authorized elderly relative
  const authorizedResidents = [];
  let aggregateTotalDosesToday = 0;
  let aggregateTakenDosesToday = 0;
  let aggregatePendingDosesToday = 0;
  let aggregateMissedDosesToday = 0;
  let aggregate7DaySum = 0;
  let residentCount = 0;

  for (const rel of relationships) {
    const elderly = rel.elderlyUserId;
    const elderlyId = elderly._id;

    // Check permissions
    const permissions = {
      viewMedications: rel.permissions.includes('view_medications'),
      manageMedications: rel.permissions.includes('manage_medications'),
      viewAppointments: rel.permissions.includes('view_appointments'),
      manageAppointments: rel.permissions.includes('manage_appointments'),
      viewHealthRecords: rel.permissions.includes('view_health_records'),
      addHealthObservations: rel.permissions.includes('add_health_observations'),
    };

    // Calculate Adherence Stats
    let adherenceStats = { adherenceRate: 100, totalDoses: 0, takenDoses: 0, missedDoses: 0 };
    if (permissions.viewMedications) {
      try {
        adherenceStats = await getAdherenceStats({
          elderlyUserId: elderlyId,
          requester: familyUser,
          days: 7,
        });
      } catch (err) {
        // Fallback default
      }
    }

    // Today's Doses
    let todayDoses = [];
    if (permissions.viewMedications) {
      try {
        todayDoses = await getTodaySchedule({
          elderlyUserId: elderlyId,
          targetDate: now,
          requester: familyUser,
        });
      } catch (err) {
        // Fallback
      }
    }

    const takenToday = todayDoses.filter((d) => d.status === 'taken').length;
    const pendingToday = todayDoses.filter((d) => d.status === 'pending').length;
    const missedToday = todayDoses.filter((d) => d.status === 'missed').length;
    const totalToday = todayDoses.length;

    aggregateTotalDosesToday += totalToday;
    aggregateTakenDosesToday += takenToday;
    aggregatePendingDosesToday += pendingToday;
    aggregateMissedDosesToday += missedToday;
    aggregate7DaySum += adherenceStats.adherenceRate || 100;
    residentCount++;

    // Upcoming Appointments
    let appointments = [];
    if (permissions.viewAppointments) {
      appointments = await Appointment.find({
        elderlyUserId: elderlyId,
        appointmentDate: { $gte: now },
        status: { $ne: 'cancelled' },
      })
        .sort({ appointmentDate: 1 })
        .limit(3);
    }

    // Recent Health Observations
    let observations = [];
    if (permissions.viewHealthRecords) {
      observations = await HealthObservation.find({ elderlyUserId: elderlyId })
        .populate('recordedBy', 'name role')
        .sort({ recordedAt: -1 })
        .limit(3);
    }

    // Care Circle contacts for this senior (caregivers, doctors, other family)
    const circleMembers = await CareRelationship.find({
      elderlyUserId: elderlyId,
      invitationStatus: 'accepted',
    })
      .populate('memberUserId', 'name email phone role profileImage')
      .lean();

    const emergencyContacts = [
      {
        name: elderly.name,
        role: 'Senior Resident',
        relationship: 'Primary Relative',
        phone: elderly.phone || 'Contact Care Desk',
        isPrimary: true,
      },
    ];

    for (const cm of circleMembers) {
      if (cm.memberUserId && cm.memberUserId._id.toString() !== familyUser._id.toString()) {
        emergencyContacts.push({
          name: cm.memberUserId.name,
          role: cm.memberUserId.role,
          relationship: cm.relationshipType,
          phone: cm.memberUserId.phone || 'Available via App',
          isPrimary: cm.relationshipType === 'nurse' || cm.relationshipType === 'caregiver',
        });
      }
    }

    authorizedResidents.push({
      id: elderlyId,
      _id: elderlyId,
      name: elderly.name,
      email: elderly.email,
      phone: elderly.phone,
      profileImage: elderly.profileImage,
      relationshipType: rel.relationshipType,
      permissions,
      adherence7Days: adherenceStats.adherenceRate || 100,
      todayDoses: {
        total: totalToday,
        taken: takenToday,
        pending: pendingToday,
        missed: missedToday,
        items: todayDoses.map((d) => ({
          _id: d._id,
          medicineName: d.medicationId?.medicineName,
          dosage: d.medicationId?.dosage,
          scheduledTimeStr: d.scheduledTimeStr,
          status: d.status,
          confirmedAt: d.confirmedAt,
          confirmedBy: d.confirmedBy?.name,
        })),
      },
      upcomingAppointments: appointments,
      recentObservations: observations,
      emergencyContacts,
    });
  }

  // 3. Collect Missed-Dose Alerts with Reassurance Context
  const missedDoseAlerts = [];
  const missedLogs = await MedicationLog.find({
    elderlyUserId: { $in: authorizedElderlyIds },
    status: 'missed',
    scheduledAt: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate('medicationId', 'medicineName dosage instructions')
    .populate('elderlyUserId', 'name profileImage')
    .sort({ scheduledAt: -1 });

  for (const missed of missedLogs) {
    // Check if urgent escalation notification was sent
    const escalation = await Notification.findOne({
      elderlyUserId: missed.elderlyUserId._id,
      relatedEntityId: missed._id,
      type: 'urgent_escalation',
    });

    missedDoseAlerts.push({
      id: missed._id,
      residentId: missed.elderlyUserId._id,
      residentName: missed.elderlyUserId.name,
      residentAvatar: missed.elderlyUserId.profileImage,
      medicineName: missed.medicationId?.medicineName || 'Prescription',
      dosage: missed.medicationId?.dosage,
      scheduledTimeStr: missed.scheduledTimeStr || 'Today',
      scheduledAt: missed.scheduledAt,
      status: 'missed',
      escalationSent: Boolean(escalation),
      escalationTime: escalation?.sentAt,
      reassuranceNote:
        'The assigned caregiver and care team have been alerted. Routine care protocol is underway; no immediate panic is needed.',
    });
  }

  // 4. Construct Unified Family Activity Feed
  const activityFeed = await buildFamilyActivityFeed({
    authorizedElderlyIds,
    limit: 25,
  });

  // 5. Global upcoming appointments across all authorized elderly
  const allUpcomingAppointments = await Appointment.find({
    elderlyUserId: { $in: authorizedElderlyIds },
    appointmentDate: { $gte: now },
    status: { $ne: 'cancelled' },
  })
    .populate('elderlyUserId', 'name profileImage')
    .sort({ appointmentDate: 1 })
    .limit(6);

  // 6. Global recent vitals/observations
  const allRecentObservations = await HealthObservation.find({
    elderlyUserId: { $in: authorizedElderlyIds },
  })
    .populate('elderlyUserId', 'name profileImage')
    .populate('recordedBy', 'name role')
    .sort({ recordedAt: -1 })
    .limit(6);

  // 7. Unread family notifications count
  const unreadAlertsCount = await Notification.countDocuments({
    recipientId: familyUser._id,
    status: { $in: ['sent', 'delivered'] },
    readAt: null,
  });

  const todayAdherenceRate =
    aggregateTotalDosesToday > 0
      ? Math.round((aggregateTakenDosesToday / aggregateTotalDosesToday) * 100)
      : 100;

  const average7DayAdherence =
    residentCount > 0 ? Math.round(aggregate7DaySum / residentCount) : 100;

  return {
    authorizedResidents,
    metrics: {
      totalSupportedSeniors: authorizedResidents.length,
      todayAdherenceRate,
      overall7DayAdherence: average7DayAdherence,
      totalPendingDosesToday: aggregatePendingDosesToday,
      totalMissedDosesToday: aggregateMissedDosesToday,
      upcomingAppointmentsCount: allUpcomingAppointments.length,
      unreadAlertsCount,
    },
    missedDoseAlerts,
    activityFeed,
    upcomingAppointments: allUpcomingAppointments,
    recentObservations: allRecentObservations,
  };
};

/**
 * Build rich family activity feed synthesizing:
 * 1. Medication confirmed / missed
 * 2. Appointment scheduled / completed
 * 3. Health observation recorded
 * 4. Caregiver clinical note added
 */
export const buildFamilyActivityFeed = async ({
  authorizedElderlyIds,
  category = 'all',
  dateRange = '7days',
  elderlyUserId = null,
  limit = 40,
}) => {
  const targetElderlyIds = elderlyUserId
    ? authorizedElderlyIds.filter((id) => id.toString() === elderlyUserId.toString())
    : authorizedElderlyIds;

  if (targetElderlyIds.length === 0) return [];

  const dateFilter = getDateRangeFilter(dateRange);
  const items = [];

  // --- 1. Medication Events (Confirmed & Missed) ---
  if (category === 'all' || category === 'medications') {
    const medQuery = {
      elderlyUserId: { $in: targetElderlyIds },
      status: { $in: ['taken', 'missed'] },
    };
    if (dateFilter) medQuery.updatedAt = dateFilter;

    const medLogs = await MedicationLog.find(medQuery)
      .populate('medicationId', 'medicineName dosage instructions')
      .populate('elderlyUserId', 'name profileImage')
      .populate('confirmedBy', 'name role')
      .sort({ updatedAt: -1 })
      .limit(limit);

    for (const log of medLogs) {
      const isTaken = log.status === 'taken';
      const actorName = log.confirmedBy?.name || (isTaken ? log.elderlyUserId?.name : 'Care Monitor');
      const actorRole = log.confirmedBy?.role || (isTaken ? 'elderly' : 'system');

      items.push({
        id: `med_${log._id}`,
        type: isTaken ? 'medication_confirmed' : 'medication_missed',
        category: 'medications',
        title: isTaken ? 'Medication Confirmed' : 'Medication Missed',
        residentId: log.elderlyUserId?._id,
        residentName: log.elderlyUserId?.name || 'Resident',
        residentAvatar: log.elderlyUserId?.profileImage,
        description: `${log.medicationId?.medicineName || 'Medication'} ${log.medicationId?.dosage ? `(${log.medicationId.dosage})` : ''} - Scheduled for ${log.scheduledTimeStr || 'today'}`,
        timestamp: log.confirmedAt || log.updatedAt || log.scheduledAt,
        actor: actorName,
        actorRole,
        notes: log.notes,
        status: log.status,
      });
    }
  }

  // --- 2. Appointment Events (Scheduled & Completed) ---
  if (category === 'all' || category === 'appointments') {
    const apptQuery = {
      elderlyUserId: { $in: targetElderlyIds },
    };
    if (dateFilter) apptQuery.createdAt = dateFilter;

    const appointments = await Appointment.find(apptQuery)
      .populate('elderlyUserId', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(limit);

    for (const appt of appointments) {
      const isCompleted = appt.status === 'completed';
      items.push({
        id: `appt_${appt._id}`,
        type: isCompleted ? 'appointment_completed' : 'appointment_scheduled',
        category: 'appointments',
        title: isCompleted ? 'Medical Visit Completed' : 'Medical Visit Scheduled',
        residentId: appt.elderlyUserId?._id,
        residentName: appt.elderlyUserId?.name || 'Resident',
        residentAvatar: appt.elderlyUserId?.profileImage,
        description: `${appt.doctorName} (${appt.specialty || 'General'}) at ${appt.clinicName || 'Clinic'} - ${new Date(appt.appointmentDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${appt.timeStr}`,
        timestamp: appt.createdAt,
        actor: appt.clinicName || 'Care Coordinator',
        actorRole: 'caregiver',
        notes: appt.notes,
        isTelehealth: appt.isTelehealth,
        telehealthLink: appt.telehealthLink,
        status: appt.status,
      });
    }
  }

  // --- 3. Health Observation Events ---
  if (category === 'all' || category === 'observations') {
    const obsQuery = {
      elderlyUserId: { $in: targetElderlyIds },
    };
    if (dateFilter) obsQuery.recordedAt = dateFilter;

    const observations = await HealthObservation.find(obsQuery)
      .populate('elderlyUserId', 'name profileImage')
      .populate('recordedBy', 'name role')
      .sort({ recordedAt: -1 })
      .limit(limit);

    for (const obs of observations) {
      items.push({
        id: `obs_${obs._id}`,
        type: 'health_observation_recorded',
        category: 'observations',
        title: `${obs.title} Logged`,
        residentId: obs.elderlyUserId?._id,
        residentName: obs.elderlyUserId?.name || 'Resident',
        residentAvatar: obs.elderlyUserId?.profileImage,
        description: `Recorded ${obs.value} ${obs.unit || ''} (Rating: ${obs.severity.toUpperCase()})`,
        timestamp: obs.recordedAt || obs.createdAt,
        actor: obs.recordedBy?.name || 'Caregiver',
        actorRole: obs.recordedBy?.role || 'caregiver',
        notes: obs.notes,
        severity: obs.severity,
      });
    }
  }

  // --- 4. Caregiver Notes Added ---
  if (category === 'all' || category === 'notes') {
    const notesQuery = {
      elderlyUserId: { $in: targetElderlyIds },
    };
    if (dateFilter) notesQuery.createdAt = dateFilter;

    const notes = await CareNote.find(notesQuery)
      .populate('elderlyUserId', 'name profileImage')
      .populate('authorId', 'name role')
      .sort({ createdAt: -1 })
      .limit(limit);

    for (const note of notes) {
      const categoryLabel = note.category.charAt(0).toUpperCase() + note.category.slice(1);
      items.push({
        id: `note_${note._id}`,
        type: 'caregiver_note_added',
        category: 'notes',
        title: `Care Note: ${categoryLabel}`,
        residentId: note.elderlyUserId?._id,
        residentName: note.elderlyUserId?.name || 'Resident',
        residentAvatar: note.elderlyUserId?.profileImage,
        description: note.note,
        timestamp: note.createdAt,
        actor: note.authorId?.name || 'Caregiver',
        actorRole: note.authorId?.role || 'caregiver',
        isPriority: note.isPriority,
      });
    }
  }

  // Sort unified feed descending by timestamp
  items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return items.slice(0, limit);
};

/**
 * Query filtered activity feed for family member.
 */
export const getFilteredFamilyActivityFeed = async ({
  familyUser,
  elderlyUserId,
  category,
  dateRange,
  limit = 50,
}) => {
  const relationships = await CareRelationship.find({
    memberUserId: familyUser._id,
    invitationStatus: 'accepted',
  });

  const authorizedElderlyIds = relationships.map((r) => r.elderlyUserId);
  if (authorizedElderlyIds.length === 0) return [];

  if (elderlyUserId) {
    const isAuthorized = authorizedElderlyIds.some(
      (id) => id.toString() === elderlyUserId.toString()
    );
    if (!isAuthorized) {
      throw ApiError.forbidden('You are not authorized to view this elderly resident’s activity feed.');
    }
  }

  return buildFamilyActivityFeed({
    authorizedElderlyIds,
    category,
    dateRange,
    elderlyUserId,
    limit,
  });
};

/**
 * Detailed single resident profile for family member.
 */
export const getFamilyResidentDetail = async ({ elderlyUserId, familyUser }) => {
  // Verify family member has accepted relationship with this resident
  let relationship = null;
  if (familyUser.role === 'admin') {
    const elderly = await User.findById(elderlyUserId);
    if (!elderly) throw ApiError.notFound('Resident not found.');
    relationship = {
      elderlyUserId: elderly,
      relationshipType: 'family',
      permissions: [
        'view_medications',
        'manage_medications',
        'view_appointments',
        'manage_appointments',
        'view_health_records',
        'add_health_observations',
      ],
    };
  } else {
    relationship = await CareRelationship.findOne({
      elderlyUserId,
      memberUserId: familyUser._id,
      invitationStatus: 'accepted',
    }).populate('elderlyUserId', 'name email phone profileImage accountStatus timezone');
  }

  if (!relationship) {
    throw ApiError.forbidden(
      'Access denied: You do not have an authorized family relationship with this resident.'
    );
  }

  const elderly = relationship.elderlyUserId;
  const permissions = {
    viewMedications: relationship.permissions.includes('view_medications'),
    manageMedications: relationship.permissions.includes('manage_medications'),
    viewAppointments: relationship.permissions.includes('view_appointments'),
    manageAppointments: relationship.permissions.includes('manage_appointments'),
    viewHealthRecords: relationship.permissions.includes('view_health_records'),
    addHealthObservations: relationship.permissions.includes('add_health_observations'),
  };

  const now = new Date();
  const adherenceStats = await getAdherenceStats({
    elderlyUserId,
    requester: familyUser,
    days: 7,
  });

  const todayDoses = await getTodaySchedule({
    elderlyUserId,
    targetDate: now,
    requester: familyUser,
  });

  const appointments = await Appointment.find({
    elderlyUserId,
    appointmentDate: { $gte: now },
    status: { $ne: 'cancelled' },
  }).sort({ appointmentDate: 1 });

  const observations = await HealthObservation.find({ elderlyUserId })
    .populate('recordedBy', 'name role')
    .sort({ recordedAt: -1 })
    .limit(10);

  const notes = await CareNote.find({ elderlyUserId })
    .populate('authorId', 'name role')
    .sort({ createdAt: -1 })
    .limit(10);

  const circleMembers = await CareRelationship.find({
    elderlyUserId,
    invitationStatus: 'accepted',
  }).populate('memberUserId', 'name email phone role profileImage');

  return {
    elderly,
    relationshipType: relationship.relationshipType,
    permissions,
    adherenceStats,
    todayDoses,
    appointments,
    observations,
    notes,
    circleMembers,
  };
};
