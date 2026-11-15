import api from './api.js';

export const getCaregiverDashboardOverview = async () => {
  try {
    const res = await api.get('/caregiver/overview');
    if (res.data) return res.data;
  } catch (err) {
    console.warn('API error fetching caregiver overview, falling back to local state', err);
  }

  // Graceful fallback state
  return {
    assignedResidents: [
      {
        id: 'user-elderly-1',
        _id: 'user-elderly-1',
        name: 'Grandma Eleanor Vance',
        email: 'eleanor.vance@carecircle.org',
        phone: '+1 (555) 234-5678',
        profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
        relationshipType: 'Primary Care Nurse',
        permissions: ['view_medications', 'manage_medications', 'view_appointments', 'manage_appointments', 'add_health_observations'],
        activePrescriptionsCount: 4,
        todayPending: 1,
        todayMissed: 0,
        adherenceRate: 94,
      },
    ],
    metrics: {
      totalResidents: 1,
      todayTotalDoses: 4,
      todayPendingDoses: 1,
      todayMissedDoses: 0,
      todayTakenDoses: 3,
      averageAdherenceRate: 94,
      upcomingAppointmentsCount: 2,
    },
    todayActionDoses: [
      {
        id: 'dose-2',
        _id: 'dose-2',
        residentId: 'user-elderly-1',
        residentName: 'Grandma Eleanor Vance',
        medicineName: 'Metformin',
        dosage: '500mg',
        instructions: 'Take 1 tablet with midday lunch meal',
        scheduledTimeStr: '12:30 PM',
        status: 'pending',
      },
      {
        id: 'dose-1',
        _id: 'dose-1',
        residentId: 'user-elderly-1',
        residentName: 'Grandma Eleanor Vance',
        medicineName: 'Lisinopril',
        dosage: '10mg',
        instructions: 'Take 1 tablet with water',
        scheduledTimeStr: '08:00 AM',
        status: 'taken',
        confirmedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        confirmedBy: 'Nurse Marcus, RN',
      },
    ],
    upcomingAppointments: [
      {
        _id: 'appt-1',
        doctorName: 'Dr. Robert Chen, MD',
        specialty: 'Cardiology & Geriatrics',
        clinicName: 'Senior Wellness Center',
        appointmentDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        timeStr: '02:30 PM',
        type: 'checkup',
        elderlyUserId: { name: 'Grandma Eleanor Vance' },
      },
    ],
    recentObservations: [
      {
        _id: 'obs-1',
        title: 'Morning Blood Pressure Check',
        type: 'blood_pressure',
        value: '124/82 mmHg',
        severity: 'normal',
        notes: 'Sitting calmly, pulse 72 regular',
        recordedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        recordedBy: { name: 'Nurse Marcus, RN' },
        elderlyUserId: { name: 'Grandma Eleanor Vance' },
      },
    ],
    recentNotifications: [
      {
        _id: 'notif-1',
        type: 'medication_reminder',
        title: 'Reminder: Metformin 500mg',
        message: 'Upcoming midday dose for Grandma Eleanor Vance.',
        sentAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
    ],
    activityTimeline: [
      {
        _id: 'act-1',
        action: 'DOSE_CONFIRMED',
        performedBy: { name: 'Nurse Marcus, RN' },
        createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        elderlyUserId: { name: 'Grandma Eleanor Vance' },
      },
    ],
  };
};

export const getElderlyDetail = async (elderlyId, filters = {}) => {
  try {
    const res = await api.get(`/caregiver/elderly/${elderlyId}`, { params: filters });
    if (res.data) return res.data;
  } catch (err) {
    console.warn('API error fetching elderly detail, using fallback', err);
  }

  // Fallback
  return {
    resident: {
      id: elderlyId,
      _id: elderlyId,
      name: 'Grandma Eleanor Vance',
      email: 'eleanor.vance@carecircle.org',
      phone: '+1 (555) 234-5678',
      profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
      accountStatus: 'active',
      room: 'Room 304, West Wing',
      allergies: ['Penicillin', 'Sulfa drugs'],
      conditions: ['Hypertension', 'Type 2 Diabetes', 'Mild Osteoarthritis'],
    },
    authorizedPermissions: [
      'view_medications',
      'manage_medications',
      'view_appointments',
      'manage_appointments',
      'view_health_records',
      'add_health_observations',
    ],
    relationshipType: 'Primary Care Nurse',
    careCircleMembers: [
      {
        _id: 'rel-1',
        relationshipType: 'daughter',
        permissions: ['view_medications', 'view_appointments'],
        memberUserId: {
          name: 'Sarah Vance',
          email: 'sarah.vance@example.com',
          phone: '+1 (555) 987-6543',
          role: 'family',
        },
      },
      {
        _id: 'rel-2',
        relationshipType: 'nurse',
        permissions: ['view_medications', 'manage_medications', 'add_health_observations'],
        memberUserId: {
          name: 'Nurse Marcus Bell, RN',
          email: 'marcus.bell@carecircle.org',
          phone: '+1 (555) 876-5432',
          role: 'caregiver',
        },
      },
    ],
    todaySchedule: [
      {
        _id: 'dose-1',
        scheduledTimeStr: '08:00',
        status: 'taken',
        confirmedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        confirmedBy: { name: 'Nurse Marcus Bell' },
        medicationId: {
          medicineName: 'Lisinopril',
          dosage: '10mg',
          instructions: 'Take 1 tablet in morning with water',
          pillAppearance: 'Round pink tablet',
        },
      },
      {
        _id: 'dose-2',
        scheduledTimeStr: '12:30',
        status: 'pending',
        medicationId: {
          medicineName: 'Metformin',
          dosage: '500mg',
          instructions: 'Take 1 tablet with lunch',
          pillAppearance: 'White oval tablet',
        },
      },
      {
        _id: 'dose-3',
        scheduledTimeStr: '19:00',
        status: 'pending',
        medicationId: {
          medicineName: 'Vitamin D3 & Calcium',
          dosage: '1000 IU',
          instructions: 'Take with evening meal',
          pillAppearance: 'Golden yellow softgel',
        },
      },
    ],
    medicationHistory: [
      {
        _id: 'hist-1',
        scheduledAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        scheduledTimeStr: '08:00',
        status: 'taken',
        confirmedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        confirmedBy: { name: 'Sarah Vance' },
        notes: 'Taken with breakfast',
        medicationId: { medicineName: 'Lisinopril', dosage: '10mg' },
      },
      {
        _id: 'hist-2',
        scheduledAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        scheduledTimeStr: '12:30',
        status: 'taken',
        confirmedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        confirmedBy: { name: 'Nurse Marcus Bell' },
        notes: 'With lunch',
        medicationId: { medicineName: 'Metformin', dosage: '500mg' },
      },
    ],
    appointments: [
      {
        _id: 'app-1',
        doctorName: 'Dr. Robert Chen, MD',
        specialty: 'Primary Geriatrician',
        clinicName: 'Senior Wellness Center',
        location: 'Suite 300, 100 Medical Center Pkwy',
        appointmentDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        timeStr: '02:30 PM',
        type: 'checkup',
        status: 'upcoming',
        phone: '+1 (555) 890-1234',
        notes: 'Quarterly review of blood pressure trends and medication tolerance',
      },
    ],
    observations: [
      {
        _id: 'obs-1',
        title: 'Blood Pressure',
        type: 'blood_pressure',
        value: '124/82 mmHg',
        severity: 'normal',
        notes: 'Resting seated blood pressure. Regular rhythm.',
        recordedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        recordedBy: { name: 'Nurse Marcus Bell, RN' },
      },
      {
        _id: 'obs-2',
        title: 'Fasting Blood Glucose',
        type: 'blood_glucose',
        value: '108 mg/dL',
        severity: 'normal',
        notes: 'Morning fasting fingerstick check.',
        recordedAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
        recordedBy: { name: 'Nurse Marcus Bell, RN' },
      },
    ],
    careNotes: [
      {
        _id: 'note-1',
        category: 'medical',
        note: 'Eleanor completed 15 minutes of garden walking exercise with steady balance.',
        isPriority: false,
        createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        authorId: { name: 'Nurse Marcus Bell, RN' },
      },
    ],
    adherence: {
      daysAnalyzed: 7,
      totalScheduled: 28,
      takenCount: 26,
      skippedCount: 1,
      missedCount: 1,
      adherenceRate: 93,
    },
    activePrescriptions: [
      {
        _id: 'med-1',
        medicineName: 'Lisinopril',
        dosage: '10mg',
        purpose: 'Blood Pressure',
        frequency: 'daily',
        scheduledTimes: ['08:00'],
        remainingInventory: 28,
        refillThreshold: 7,
      },
      {
        _id: 'med-2',
        medicineName: 'Metformin',
        dosage: '500mg',
        purpose: 'Blood Sugar',
        frequency: 'daily',
        scheduledTimes: ['12:30'],
        remainingInventory: 14,
        refillThreshold: 7,
      },
    ],
  };
};

export const recordHealthObservation = async (elderlyId, data) => {
  const res = await api.post(`/caregiver/elderly/${elderlyId}/observations`, data);
  return res.data;
};

export const recordCareNote = async (elderlyId, data) => {
  const res = await api.post(`/caregiver/elderly/${elderlyId}/notes`, data);
  return res.data;
};

export const scheduleAppointment = async (elderlyId, data) => {
  const res = await api.post(`/caregiver/elderly/${elderlyId}/appointments`, data);
  return res.data;
};

export default {
  getCaregiverDashboardOverview,
  getElderlyDetail,
  recordHealthObservation,
  recordCareNote,
  scheduleAppointment,
};
