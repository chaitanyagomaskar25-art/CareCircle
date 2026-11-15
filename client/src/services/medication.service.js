import api from './api.js';
import { mockMedications } from './mockData.js';

const STORAGE_KEY = 'carecircle_meds_state';
const DOSES_KEY = 'carecircle_doses_state';

const getInitialPrescriptions = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed parsing saved medications', e);
    }
  }

  return [
    {
      id: 'med-1',
      _id: 'med-1',
      elderlyUserId: 'user-elderly',
      medicineName: 'Lisinopril',
      dosage: '10mg',
      instructions: 'Take 1 tablet in the morning with a full glass of water',
      purpose: 'Blood Pressure Management',
      frequency: 'daily',
      scheduledTimes: ['08:00'],
      status: 'active',
      pillAppearance: 'Round pink tablet with score line',
      remainingInventory: 28,
      refillThreshold: 7,
      prescribedBy: 'Dr. Robert Chen, MD',
      startDate: new Date().toISOString(),
    },
    {
      id: 'med-2',
      _id: 'med-2',
      elderlyUserId: 'user-elderly',
      medicineName: 'Metformin',
      dosage: '500mg',
      instructions: 'Take 1 tablet with midday lunch meal',
      purpose: 'Blood Sugar Regulation',
      frequency: 'daily',
      scheduledTimes: ['12:30'],
      status: 'active',
      pillAppearance: 'White oval tablet',
      remainingInventory: 14,
      refillThreshold: 7,
      prescribedBy: 'Dr. Robert Chen, MD',
      startDate: new Date().toISOString(),
    },
    {
      id: 'med-3',
      _id: 'med-3',
      elderlyUserId: 'user-elderly',
      medicineName: 'Vitamin D3 & Calcium',
      dosage: '1000 IU',
      instructions: 'Take 1 capsule in the evening after dinner',
      purpose: 'Bone Density & Vitality',
      frequency: 'daily',
      scheduledTimes: ['19:00'],
      status: 'active',
      pillAppearance: 'Golden yellow softgel',
      remainingInventory: 45,
      refillThreshold: 10,
      prescribedBy: 'Dr. Robert Chen, MD',
      startDate: new Date().toISOString(),
    },
    {
      id: 'med-4',
      _id: 'med-4',
      elderlyUserId: 'user-elderly',
      medicineName: 'Atorvastatin',
      dosage: '20mg',
      instructions: 'Take 1 tablet at bedtime before sleep',
      purpose: 'Cholesterol Regulation',
      frequency: 'daily',
      scheduledTimes: ['21:30'],
      status: 'active',
      pillAppearance: 'Small white round tablet',
      remainingInventory: 5,
      refillThreshold: 7,
      prescribedBy: 'Dr. Robert Chen, MD',
      startDate: new Date().toISOString(),
    },
  ];
};

const getInitialDoses = () => {
  const saved = localStorage.getItem(DOSES_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed parsing saved doses', e);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  return [
    {
      id: 'dose-1',
      _id: 'dose-1',
      medicationId: 'med-1',
      elderlyUserId: 'user-elderly',
      scheduledTimeStr: '08:00',
      timeSlot: 'Morning',
      scheduledAt: `${today}T08:00:00.000Z`,
      status: 'taken',
      confirmedAt: `${today}T08:14:00.000Z`,
      confirmedBy: 'Sarah Vance',
      notes: 'Swallowed with orange juice',
    },
    {
      id: 'dose-2',
      _id: 'dose-2',
      medicationId: 'med-2',
      elderlyUserId: 'user-elderly',
      scheduledTimeStr: '12:30',
      timeSlot: 'Afternoon',
      scheduledAt: `${today}T12:30:00.000Z`,
      status: 'pending',
      confirmedAt: null,
      confirmedBy: null,
      notes: '',
    },
    {
      id: 'dose-3',
      _id: 'dose-3',
      medicationId: 'med-3',
      elderlyUserId: 'user-elderly',
      scheduledTimeStr: '19:00',
      timeSlot: 'Evening',
      scheduledAt: `${today}T19:00:00.000Z`,
      status: 'pending',
      confirmedAt: null,
      confirmedBy: null,
      notes: '',
    },
    {
      id: 'dose-4',
      _id: 'dose-4',
      medicationId: 'med-4',
      elderlyUserId: 'user-elderly',
      scheduledTimeStr: '21:30',
      timeSlot: 'Night',
      scheduledAt: `${today}T21:30:00.000Z`,
      status: 'pending',
      confirmedAt: null,
      confirmedBy: null,
      notes: '',
    },
  ];
};

let prescriptions = getInitialPrescriptions();
let doses = getInitialDoses();

const persist = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prescriptions));
  localStorage.setItem(DOSES_KEY, JSON.stringify(doses));
};

export const getMedications = async (elderlyUserId, status) => {
  try {
    const res = await api.get('/medications', { params: { elderlyUserId, status } });
    if (res.data && res.data.length > 0) return res.data;
  } catch (err) {
    // Fallback to local storage state
  }

  let filtered = [...prescriptions];
  if (status) {
    filtered = filtered.filter((m) => m.status === status);
  }
  return filtered;
};

export const getMedicationById = async (id) => {
  try {
    const res = await api.get(`/medications/${id}`);
    if (res.data) return res.data;
  } catch (err) {
    // fallback
  }

  const found = prescriptions.find((m) => m.id === id || m._id === id);
  if (!found) throw new Error('Medication prescription not found.');
  return found;
};

export const createMedication = async (data) => {
  try {
    const res = await api.post('/medications', data);
    if (res.data) {
      prescriptions.unshift(res.data);
      persist();
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  const newMed = {
    id: `med-${Date.now()}`,
    _id: `med-${Date.now()}`,
    ...data,
    status: data.status || 'active',
    remainingInventory: data.remainingInventory || 30,
    refillThreshold: data.refillThreshold || 7,
    createdAt: new Date().toISOString(),
  };

  prescriptions.unshift(newMed);

  // Generate today dose records
  const today = new Date().toISOString().split('T')[0];
  for (const timeStr of newMed.scheduledTimes || ['08:00']) {
    doses.push({
      id: `dose-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      _id: `dose-${Date.now()}`,
      medicationId: newMed.id,
      elderlyUserId: newMed.elderlyUserId || 'user-elderly',
      scheduledTimeStr: timeStr,
      scheduledAt: `${today}T${timeStr}:00.000Z`,
      status: 'pending',
      confirmedAt: null,
      confirmedBy: null,
      notes: '',
    });
  }

  persist();
  return newMed;
};

export const updateMedication = async (id, updates) => {
  try {
    const res = await api.put(`/medications/${id}`, updates);
    if (res.data) {
      prescriptions = prescriptions.map((m) => (m.id === id || m._id === id ? res.data : m));
      persist();
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  prescriptions = prescriptions.map((m) => {
    if (m.id === id || m._id === id) {
      return { ...m, ...updates };
    }
    return m;
  });

  persist();
  return prescriptions.find((m) => m.id === id || m._id === id);
};

export const deleteMedication = async (id) => {
  try {
    await api.delete(`/medications/${id}`);
  } catch (err) {
    // fallback
  }

  prescriptions = prescriptions.map((m) => {
    if (m.id === id || m._id === id) {
      return { ...m, status: 'discontinued' };
    }
    return m;
  });

  persist();
  return { message: 'Medication discontinued.' };
};

export const getTodaySchedule = async (elderlyUserId) => {
  try {
    const res = await api.get(`/medications/schedule/${elderlyUserId}/today`);
    if (res.data && res.data.length > 0) return res.data;
  } catch (err) {
    // fallback
  }

  // Populate doses with medication details
  const populated = doses.map((d) => {
    const med = prescriptions.find((m) => m.id === d.medicationId || m._id === d.medicationId);
    return {
      ...d,
      medicationId: med || {
        medicineName: 'Prescription Medication',
        dosage: '1 dose',
        instructions: 'Take with water',
        pillAppearance: 'Tablet',
      },
    };
  });

  // Sort by time
  populated.sort((a, b) => a.scheduledTimeStr.localeCompare(b.scheduledTimeStr));
  return populated;
};

export const confirmDoseTaken = async (doseId, notes = '') => {
  try {
    const res = await api.post(`/medications/doses/${doseId}/take`, { notes });
    if (res.data) return res.data;
  } catch (err) {
    // fallback
  }

  const now = new Date();
  doses = doses.map((d) => {
    if (d.id === doseId || d._id === doseId) {
      return {
        ...d,
        status: 'taken',
        confirmedAt: now.toISOString(),
        confirmedBy: 'Primary Caregiver',
        notes: notes || d.notes,
      };
    }
    return d;
  });

  // Decrement inventory
  const targetDose = doses.find((d) => d.id === doseId || d._id === doseId);
  if (targetDose) {
    prescriptions = prescriptions.map((m) => {
      if ((m.id === targetDose.medicationId || m._id === targetDose.medicationId) && m.remainingInventory > 0) {
        return { ...m, remainingInventory: m.remainingInventory - 1 };
      }
      return m;
    });
  }

  persist();
  return doses.find((d) => d.id === doseId || d._id === doseId);
};

export const skipDose = async (doseId, notes = 'Skipped by caregiver') => {
  try {
    const res = await api.post(`/medications/doses/${doseId}/skip`, { notes });
    if (res.data) return res.data;
  } catch (err) {
    // fallback
  }

  const now = new Date();
  doses = doses.map((d) => {
    if (d.id === doseId || d._id === doseId) {
      return {
        ...d,
        status: 'skipped',
        confirmedAt: now.toISOString(),
        confirmedBy: 'Primary Caregiver',
        notes,
      };
    }
    return d;
  });

  persist();
  return doses.find((d) => d.id === doseId || d._id === doseId);
};

export const getMedicationHistory = async (elderlyUserId, filters = {}) => {
  try {
    const res = await api.get(`/medications/history/${elderlyUserId}`, { params: filters });
    if (res.data) return res.data;
  } catch (err) {
    // fallback
  }

  const populated = doses.map((d) => {
    const med = prescriptions.find((m) => m.id === d.medicationId || m._id === d.medicationId);
    return {
      ...d,
      medicationId: med || { medicineName: 'Medication', dosage: '1 dose' },
    };
  });

  return {
    doses: populated,
    pagination: { total: populated.length, page: 1, limit: 50, pages: 1 },
  };
};

export const getAdherenceStats = async (elderlyUserId, days = 7) => {
  try {
    const res = await api.get(`/medications/adherence/${elderlyUserId}`, { params: { days } });
    if (res.data) return res.data;
  } catch (err) {
    // fallback
  }

  const total = doses.length;
  const taken = doses.filter((d) => d.status === 'taken').length;
  const skipped = doses.filter((d) => d.status === 'skipped').length;
  const missed = doses.filter((d) => d.status === 'missed').length;
  const pending = doses.filter((d) => d.status === 'pending').length;

  const denominator = total - pending;
  const rate = denominator > 0 ? Math.round((taken / denominator) * 100) : 100;

  return {
    daysAnalyzed: days,
    totalScheduled: total,
    takenCount: taken,
    skippedCount: skipped,
    missedCount: missed,
    pendingCount: pending,
    adherenceRate: rate,
  };
};

export default {
  getMedications,
  getMedicationById,
  createMedication,
  updateMedication,
  deleteMedication,
  getTodaySchedule,
  confirmDoseTaken,
  skipDose,
  getMedicationHistory,
  getAdherenceStats,
};
