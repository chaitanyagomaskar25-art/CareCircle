import { api } from './api.js';

// Realistic fallback data for demo / offline scenarios
const mockFamilyFallback = {
  authorizedResidents: [
    {
      id: 'mock_eleanor',
      _id: 'mock_eleanor',
      name: 'Grandma Eleanor',
      email: 'eleanor@carecircle.test',
      phone: '+1 (555) 234-5678',
      profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
      relationshipType: 'daughter',
      permissions: {
        viewMedications: true,
        manageMedications: false, // View-only demonstration
        viewAppointments: true,
        manageAppointments: false, // View-only demonstration
        viewHealthRecords: true,
        addHealthObservations: false,
      },
      adherence7Days: 94,
      todayDoses: {
        total: 3,
        taken: 2,
        pending: 1,
        missed: 0,
        items: [
          {
            _id: 'dose_1',
            medicineName: 'Donepezil',
            dosage: '10mg',
            scheduledTimeStr: '08:00 AM',
            status: 'taken',
            confirmedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
            confirmedBy: 'Nurse Marcus, RN',
          },
          {
            _id: 'dose_2',
            medicineName: 'Amlodipine',
            dosage: '5mg',
            scheduledTimeStr: '12:00 PM',
            status: 'taken',
            confirmedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
            confirmedBy: 'Grandma Eleanor (Self)',
          },
          {
            _id: 'dose_3',
            medicineName: 'Lisinopril',
            dosage: '10mg',
            scheduledTimeStr: '08:00 PM',
            status: 'pending',
          },
        ],
      },
      upcomingAppointments: [
        {
          _id: 'appt_1',
          doctorName: 'Dr. Emily Watson',
          specialty: 'Neurologist',
          clinicName: 'St. Jude Memory Care Clinic',
          appointmentDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
          timeStr: '10:30 AM',
          type: 'specialist',
          status: 'upcoming',
          isTelehealth: true,
          telehealthLink: 'https://meet.carecircle.test/room-watson',
        },
        {
          _id: 'appt_2',
          doctorName: 'Dr. Robert Miller',
          specialty: 'Primary Geriatrician',
          clinicName: 'Oakwood Health Center',
          appointmentDate: new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString(),
          timeStr: '02:00 PM',
          type: 'checkup',
          status: 'upcoming',
          isTelehealth: false,
        },
      ],
      recentObservations: [
        {
          _id: 'obs_1',
          title: 'Blood Pressure',
          value: '118/76',
          unit: 'mmHg',
          severity: 'normal',
          recordedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          recordedBy: { name: 'Nurse Marcus, RN', role: 'caregiver' },
          notes: 'Resting seated blood pressure optimal.',
        },
        {
          _id: 'obs_2',
          title: 'Blood Glucose',
          value: '102',
          unit: 'mg/dL',
          severity: 'normal',
          recordedAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
          recordedBy: { name: 'Nurse Marcus, RN', role: 'caregiver' },
          notes: 'Fasting glucose level is well stabilized.',
        },
        {
          _id: 'obs_3',
          title: 'Resting Heart Rate',
          value: '72',
          unit: 'bpm',
          severity: 'normal',
          recordedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
          recordedBy: { name: 'Nurse Marcus, RN', role: 'caregiver' },
          notes: 'Regular sinus rhythm.',
        },
      ],
      emergencyContacts: [
        {
          name: 'Grandma Eleanor',
          role: 'Senior Resident',
          relationship: 'Primary Relative',
          phone: '+1 (555) 234-5678',
          isPrimary: true,
        },
        {
          name: 'Nurse Marcus, RN',
          role: 'caregiver',
          relationship: 'Primary Caregiver',
          phone: '+1 (555) 345-6789',
          isPrimary: true,
        },
        {
          name: 'Dr. Robert Miller',
          role: 'doctor',
          relationship: 'Primary Geriatrician',
          phone: '+1 (555) 456-7890',
          isPrimary: false,
        },
        {
          name: 'Oakwood Care Desk & Emergency',
          role: 'facility',
          relationship: '24/7 Facility Support',
          phone: '+1 (555) 911-0000',
          isPrimary: true,
        },
      ],
    },
  ],
  metrics: {
    totalSupportedSeniors: 1,
    todayAdherenceRate: 100,
    overall7DayAdherence: 94,
    totalPendingDosesToday: 1,
    totalMissedDosesToday: 0,
    upcomingAppointmentsCount: 2,
    unreadAlertsCount: 0,
  },
  missedDoseAlerts: [],
  activityFeed: [
    {
      id: 'feed_1',
      type: 'medication_confirmed',
      category: 'medications',
      title: 'Medication Confirmed',
      residentName: 'Grandma Eleanor',
      description: 'Donepezil (10mg) - Scheduled for 08:00 AM',
      timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      actor: 'Nurse Marcus, RN',
      actorRole: 'caregiver',
      status: 'taken',
      notes: 'Administered with breakfast',
    },
    {
      id: 'feed_2',
      type: 'health_observation_recorded',
      category: 'observations',
      title: 'Blood Pressure Logged',
      residentName: 'Grandma Eleanor',
      description: 'Recorded 118/76 mmHg (Rating: NORMAL)',
      timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      actor: 'Nurse Marcus, RN',
      actorRole: 'caregiver',
      severity: 'normal',
      notes: 'Optimal geriatric blood pressure reading.',
    },
    {
      id: 'feed_3',
      type: 'caregiver_note_added',
      category: 'notes',
      title: 'Care Note: General Wellness',
      residentName: 'Grandma Eleanor',
      description: 'Eleanor joined the courtyard gardening group this morning. Cheerful spirits and finished full lunch.',
      timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      actor: 'Nurse Marcus, RN',
      actorRole: 'caregiver',
      isPriority: false,
    },
    {
      id: 'feed_4',
      type: 'medication_confirmed',
      category: 'medications',
      title: 'Medication Confirmed',
      residentName: 'Grandma Eleanor',
      description: 'Amlodipine (5mg) - Scheduled for 12:00 PM',
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      actor: 'Grandma Eleanor',
      actorRole: 'elderly',
      status: 'taken',
      notes: 'Self-confirmed with glass of water',
    },
    {
      id: 'feed_5',
      type: 'appointment_scheduled',
      category: 'appointments',
      title: 'Medical Visit Scheduled',
      residentName: 'Grandma Eleanor',
      description: 'Dr. Emily Watson (Neurologist) at St. Jude Memory Care Clinic - Nov 19 at 10:30 AM',
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      actor: 'St. Jude Memory Care Clinic',
      actorRole: 'caregiver',
      isTelehealth: true,
      telehealthLink: 'https://meet.carecircle.test/room-watson',
      status: 'upcoming',
    },
  ],
  upcomingAppointments: [
    {
      _id: 'appt_1',
      doctorName: 'Dr. Emily Watson',
      specialty: 'Neurologist',
      clinicName: 'St. Jude Memory Care Clinic',
      appointmentDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
      timeStr: '10:30 AM',
      type: 'specialist',
      status: 'upcoming',
      isTelehealth: true,
      telehealthLink: 'https://meet.carecircle.test/room-watson',
    },
  ],
  recentObservations: [
    {
      _id: 'obs_1',
      title: 'Blood Pressure',
      value: '118/76',
      unit: 'mmHg',
      severity: 'normal',
      recordedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      recordedBy: { name: 'Nurse Marcus, RN', role: 'caregiver' },
      notes: 'Resting seated blood pressure optimal.',
    },
  ],
};

/**
 * Fetch full family dashboard overview
 */
export const getFamilyDashboardOverview = async () => {
  try {
    const res = await api.get('/family/dashboard');
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    return mockFamilyFallback;
  } catch (err) {
    console.warn('Using offline fallback for family dashboard:', err.message);
    return mockFamilyFallback;
  }
};

/**
 * Fetch filtered activity feed
 */
export const getFamilyActivityFeed = async ({
  elderlyUserId = '',
  category = 'all',
  dateRange = '7days',
  limit = 40,
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (elderlyUserId) params.append('elderlyUserId', elderlyUserId);
    if (category) params.append('category', category);
    if (dateRange) params.append('dateRange', dateRange);
    if (limit) params.append('limit', limit);

    const res = await api.get(`/family/activity-feed?${params.toString()}`);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    return mockFamilyFallback.activityFeed;
  } catch (err) {
    console.warn('Using offline fallback for activity feed:', err.message);
    return mockFamilyFallback.activityFeed;
  }
};

/**
 * Fetch single resident profile for family member
 */
export const getFamilyResidentDetail = async (elderlyId) => {
  try {
    const res = await api.get(`/family/resident/${elderlyId}`);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    return mockFamilyFallback.authorizedResidents[0];
  } catch (err) {
    console.warn('Using offline fallback for family resident detail:', err.message);
    return mockFamilyFallback.authorizedResidents[0];
  }
};
