import {
  mockElderlyProfile,
  mockMedications,
  mockCareCircleMembers,
  mockRecentActivities,
  mockVitals,
} from './mockData.js';
import { confirmDoseTaken } from './medication.service.js';

// In-memory / localStorage state persistence for elderly dashboard
const STORAGE_KEY = 'carecircle_elderly_state';

const getInitialState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed parsing saved elderly dashboard state', e);
    }
  }

  return {
    profile: mockElderlyProfile,
    medications: mockMedications,
    wellness: {
      todayFeeling: 'good', // 'great' | 'good' | 'okay' | 'not-well' | null
      lastCheckedAt: '8:15 AM today',
      waterGlasses: 5,
      waterTarget: 8,
      streak: 12,
    },
    upcomingAppointment: {
      id: 'apt-1',
      doctorName: 'Dr. Robert Chen, MD',
      specialty: 'Primary Geriatrician',
      clinicName: 'Memorial Health Senior Center',
      address: 'Suite 300, 100 Medical Center Parkway',
      date: 'Thursday, Nov 19',
      time: '02:30 PM',
      type: 'Quarterly Check-up & BP Review',
      phone: '+1 (555) 890-1234',
      isTelehealth: false,
    },
    emergencyContacts: mockCareCircleMembers.filter((m) => m.isEmergencyContact),
    recentActivities: mockRecentActivities,
  };
};

let currentState = getInitialState();

const persistState = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
};

/**
 * Fetch the complete personalized elderly dashboard data.
 * Ready for drop-in replacement with real backend API: `await api.get('/elderly/dashboard')`
 */
export const getDashboardData = async () => {
  // Simulate lightweight async fetch
  await new Promise((r) => setTimeout(r, 150));
  return { ...currentState };
};

/**
 * Mark a medication as taken by the senior.
 * Drop-in ready for: `await api.post('/medications/log', { medId, status: 'taken' })`
 */
export const confirmMedicationTaken = async (medId) => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  currentState.medications = currentState.medications.map((med) => {
    if (med.id === medId) {
      return {
        ...med,
        status: 'taken',
        takenAt: `${timeStr} today`,
      };
    }
    return med;
  });

  const targetMed = currentState.medications.find((m) => m.id === medId);

  // Add to recent activity audit
  currentState.recentActivities.unshift({
    id: `act-${Date.now()}`,
    user: currentState.profile.preferredName,
    action: `Confirmed ${targetMed?.name || 'medication'} ${targetMed?.dosage || ''} taken`,
    time: `${timeStr} today`,
    type: 'medication',
    icon: 'pill',
  });

  // Sync with global doses if applicable
  try {
    confirmDoseTaken(medId, 'Confirmed taken on senior interface');
  } catch (err) {
    // Non-blocking
  }

  persistState();
  return { ...currentState };
};

/**
 * Snooze a medication reminder.
 */
export const snoozeMedication = async (medId, minutes = 15) => {
  const targetMed = currentState.medications.find((m) => m.id === medId);
  const now = new Date();
  const snoozeTime = new Date(now.getTime() + minutes * 60000);
  const snoozeStr = snoozeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  currentState.recentActivities.unshift({
    id: `act-${Date.now()}`,
    user: currentState.profile.preferredName,
    action: `Snoozed ${targetMed?.name || 'medication'} reminder for ${minutes} minutes (Next: ${snoozeStr})`,
    time: 'Just now',
    type: 'system',
    icon: 'bell',
  });

  persistState();
  return { snoozeStr, med: targetMed };
};

/**
 * Record daily wellness feeling check-in.
 */
export const recordWellnessCheckIn = async (feeling, note = '') => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  currentState.wellness.todayFeeling = feeling;
  currentState.wellness.lastCheckedAt = `${timeStr} today`;
  currentState.wellness.streak += 1;

  currentState.recentActivities.unshift({
    id: `act-${Date.now()}`,
    user: currentState.profile.preferredName,
    action: `Logged daily wellness check-in: Feeling ${feeling.toUpperCase()}`,
    time: `${timeStr} today`,
    type: 'wellness',
    icon: 'smile',
  });

  persistState();
  return { ...currentState.wellness };
};

/**
 * Log a glass of water.
 */
export const logWaterIntake = async () => {
  if (currentState.wellness.waterGlasses < currentState.wellness.waterTarget) {
    currentState.wellness.waterGlasses += 1;
    persistState();
  }
  return currentState.wellness.waterGlasses;
};

export default {
  getDashboardData,
  confirmMedicationTaken,
  snoozeMedication,
  recordWellnessCheckIn,
  logWaterIntake,
};
