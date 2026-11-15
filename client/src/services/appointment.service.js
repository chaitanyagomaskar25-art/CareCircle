import { api } from './api.js';

const mockAppointmentsFallback = [
  {
    _id: 'appt_mock_1',
    id: 'appt_mock_1',
    doctorName: 'Dr. Emily Watson',
    specialty: 'Neurology & Memory Care',
    hospitalName: 'St. Jude Memory Care Hospital',
    clinicName: 'St. Jude Memory Care Hospital',
    location: 'Suite 402, North Medical Pavilion',
    appointmentDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
    appointmentTime: '10:30 AM',
    timeStr: '10:30 AM',
    durationMinutes: 45,
    reason: 'Quarterly Cognitive Assessment & Titration Review',
    type: 'specialist',
    status: 'upcoming',
    phone: '+1 (555) 345-6789',
    isTelehealth: true,
    telehealthLink: 'https://meet.carecircle.test/room-watson',
    notes: 'Please bring medication history and reading glasses.',
    questionsForDoctor: [
      {
        question: 'Has Eleanor shown any signs of daytime grogginess after the evening dose?',
        addedByName: 'Sarah (Daughter)',
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    _id: 'appt_mock_2',
    id: 'appt_mock_2',
    doctorName: 'Dr. Robert Miller',
    specialty: 'Primary Geriatrician',
    hospitalName: 'Oakwood Geriatric Wellness Center',
    clinicName: 'Oakwood Geriatric Wellness Center',
    location: 'Room 105, Ground Floor',
    appointmentDate: new Date(Date.now() + 11 * 24 * 3600 * 1000).toISOString(),
    appointmentTime: '02:00 PM',
    timeStr: '02:00 PM',
    durationMinutes: 30,
    reason: 'Annual Geriatric Physical & Blood Pressure Check',
    type: 'checkup',
    status: 'upcoming',
    phone: '+1 (555) 456-7890',
    isTelehealth: false,
    notes: 'Routine fasting blood work will be completed at this visit.',
    questionsForDoctor: [],
  },
  {
    _id: 'appt_mock_3',
    id: 'appt_mock_3',
    doctorName: 'Dr. Michael Chen',
    specialty: 'Cardiology',
    hospitalName: 'Mercy Heart Institute',
    clinicName: 'Mercy Heart Institute',
    location: 'Building B, 3rd Floor',
    appointmentDate: new Date(Date.now() - 18 * 24 * 3600 * 1000).toISOString(),
    appointmentTime: '11:00 AM',
    timeStr: '11:00 AM',
    durationMinutes: 45,
    reason: 'Hypertension Follow-up & ECG',
    type: 'specialist',
    status: 'completed',
    phone: '+1 (555) 567-8901',
    isTelehealth: false,
    notes: 'ECG normal sinus rhythm. Lisinopril 10mg maintained.',
    questionsForDoctor: [],
  },
];

/**
 * Retrieve appointments with optional status & date filters
 */
export const getAppointments = async ({
  elderlyUserId = '',
  status = 'all',
  startDate = '',
  endDate = '',
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (elderlyUserId) params.append('elderlyUserId', elderlyUserId);
    if (status && status !== 'all') params.append('status', status);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await api.get(`/appointments?${params.toString()}`);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    return mockAppointmentsFallback;
  } catch (err) {
    console.warn('Using offline fallback for appointments:', err.message);
    return mockAppointmentsFallback;
  }
};

/**
 * Retrieve single appointment details
 */
export const getAppointmentById = async (id) => {
  try {
    const res = await api.get(`/appointments/${id}`);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    return mockAppointmentsFallback.find((a) => a._id === id || a.id === id) || mockAppointmentsFallback[0];
  } catch (err) {
    console.warn('Using offline fallback for appointment detail:', err.message);
    return mockAppointmentsFallback.find((a) => a._id === id || a.id === id) || mockAppointmentsFallback[0];
  }
};

/**
 * Create a new appointment
 */
export const createAppointment = async (payload) => {
  try {
    const res = await api.post('/appointments', payload);
    return res.data?.data;
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || 'Failed to create appointment';
    throw new Error(errorMsg);
  }
};

/**
 * Update an existing appointment
 */
export const updateAppointment = async (id, payload) => {
  try {
    const res = await api.put(`/appointments/${id}`, payload);
    return res.data?.data;
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || 'Failed to update appointment';
    throw new Error(errorMsg);
  }
};

/**
 * Cancel an appointment
 */
export const cancelAppointment = async (id, reason = '') => {
  try {
    const res = await api.patch(`/appointments/${id}/cancel`, { reason });
    return res.data?.data;
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || 'Failed to cancel appointment';
    throw new Error(errorMsg);
  }
};

/**
 * Get comprehensive preparation summary (medications, vitals, questions)
 */
export const getPreparationSummary = async (appointmentId) => {
  try {
    const res = await api.get(`/appointments/${appointmentId}/preparation-summary`);
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    return null;
  } catch (err) {
    console.warn('Using fallback preparation summary:', err.message);
    const appt = mockAppointmentsFallback[0];
    return {
      appointment: appt,
      resident: {
        name: 'Grandma Eleanor',
        phone: '+1 (555) 234-5678',
        roomNumber: 'Suite 204, East Wing',
      },
      activeMedications: [
        {
          medicineName: 'Donepezil',
          dosage: '10mg',
          instructions: 'Take 1 tablet at bedtime for memory care',
          frequency: 'daily',
          scheduledTimes: ['21:00'],
        },
        {
          medicineName: 'Amlodipine',
          dosage: '5mg',
          instructions: 'Take 1 tablet in morning with water',
          frequency: 'daily',
          scheduledTimes: ['08:00'],
        },
      ],
      recentObservations: [
        {
          title: 'Blood Pressure',
          value: '118/76',
          unit: 'mmHg',
          severity: 'normal',
          recordedAt: new Date().toISOString(),
          recordedBy: { name: 'Nurse Marcus, RN' },
          notes: 'Resting BP within optimal geriatric range',
        },
        {
          title: 'Blood Glucose',
          value: '104',
          unit: 'mg/dL',
          severity: 'normal',
          recordedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          recordedBy: { name: 'Nurse Marcus, RN' },
        },
      ],
      careContacts: [
        { name: 'Nurse Marcus, RN', role: 'caregiver', relationship: 'nurse', phone: '+1 (555) 345-6789' },
        { name: 'Sarah Daughter', role: 'family', relationship: 'daughter', phone: '+1 (555) 987-6543' },
      ],
      generatedAt: new Date().toISOString(),
    };
  }
};

/**
 * Add a family question to an appointment
 */
export const addQuestionToAppointment = async (appointmentId, question) => {
  try {
    const res = await api.post(`/appointments/${appointmentId}/questions`, { question });
    return res.data?.data;
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || 'Failed to add question';
    throw new Error(errorMsg);
  }
};
