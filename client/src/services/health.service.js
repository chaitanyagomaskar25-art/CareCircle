import api from './api.js';

const STORAGE_PREFIX = 'carecircle_health_';

const getLocalStorageData = (elderlyId) => {
  const key = `${STORAGE_PREFIX}${elderlyId || 'default'}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed parsing local health profile state', e);
    }
  }

  // Realistic default profile for Grandma Eleanor
  const now = Date.now();
  const day = 24 * 3600 * 1000;

  const defaultState = {
    profile: {
      bloodType: 'A+',
      notes: 'Monitored for mild morning blood pressure variance. Patient responds well to gentle reminders.',
      medicalConditions: [
        {
          _id: 'cond-1',
          name: 'Hypertension (Stage 1)',
          diagnosedDate: '2021-04-12',
          status: 'managed',
          source: 'verified_medical',
          verifiedBy: 'Dr. Robert Chen, MD',
          notes: 'Stabilized with daily Lisinopril 10mg.',
        },
        {
          _id: 'cond-2',
          name: 'Type 2 Diabetes Mellitus',
          diagnosedDate: '2019-11-05',
          status: 'managed',
          source: 'verified_medical',
          verifiedBy: 'Dr. Robert Chen, MD',
          notes: 'Diet-regulated and supported with Metformin 500mg with meals.',
        },
        {
          _id: 'cond-3',
          name: 'Osteoarthritis (Bilateral Knees)',
          diagnosedDate: '2023-02-18',
          status: 'active',
          source: 'manual',
          verifiedBy: 'Sarah Vance (Caregiver Log)',
          notes: 'Mild morning stiffness reported after damp weather.',
        },
      ],
      allergies: [
        {
          _id: 'all-1',
          allergen: 'Penicillin',
          severity: 'severe',
          reaction: 'Cutaneous hives and respiratory bronchospasm',
          source: 'verified_medical',
          verifiedBy: 'Dr. Robert Chen, MD',
        },
        {
          _id: 'all-2',
          allergen: 'Sulfa Antibiotics',
          severity: 'moderate',
          reaction: 'Erythematous skin rash',
          source: 'verified_medical',
          verifiedBy: 'Memorial Health Clinic',
        },
        {
          _id: 'all-3',
          allergen: 'Tree Nuts (Walnuts)',
          severity: 'moderate',
          reaction: 'Oral itching and lip edema',
          source: 'manual',
          verifiedBy: 'Family reported',
        },
      ],
      emergencyContacts: [
        {
          _id: 'ec-1',
          name: 'Sarah Vance',
          relationship: 'Daughter & Primary Caregiver',
          phone: '+1 (555) 234-8901',
          email: 'sarah.vance@carecircle.org',
          address: '742 Evergreen Terrace, Springfield',
          isPrimary: true,
        },
        {
          _id: 'ec-2',
          name: 'David Vance',
          relationship: 'Son (Secondary Emergency)',
          phone: '+1 (555) 678-9012',
          email: 'david.vance@carecircle.org',
          address: '104 Oakridge Way, Springfield',
          isPrimary: false,
        },
        {
          _id: 'ec-3',
          name: 'Oakridge Senior Living Security Desk',
          relationship: 'Residence Front Desk 24/7',
          phone: '+1 (555) 911-0100',
          email: 'desk@oakridgeseniors.com',
          address: 'Bldg A Front Concierge',
          isPrimary: false,
        },
      ],
      doctorInformation: [
        {
          _id: 'doc-1',
          name: 'Dr. Robert Chen, MD',
          specialty: 'Geriatric Medicine & Primary Care',
          clinic: 'Memorial Health Senior Center',
          phone: '+1 (555) 890-1234',
          email: 'dr.chen@memorialhealth.com',
          address: 'Suite 300, 100 Medical Center Parkway',
          isPrimaryCare: true,
        },
        {
          _id: 'doc-2',
          name: 'Dr. Lisa Montgomery, FACC',
          specialty: 'Cardiovascular Health',
          clinic: 'Springfield Heart & Vascular Institute',
          phone: '+1 (555) 432-8765',
          email: 'info@springfieldheart.org',
          address: '250 Wellness Blvd, Suite 410',
          isPrimaryCare: false,
        },
        {
          _id: 'doc-3',
          name: 'Dr. Angela Rossi, OD',
          specialty: 'Geriatric Optometry',
          clinic: 'Clarity Eye Care',
          phone: '+1 (555) 345-6789',
          email: 'appointments@clarityeyecare.com',
          address: '88 Horizon Plaza',
          isPrimaryCare: false,
        },
      ],
    },
    observations: [
      // Blood Pressure points over recent days
      {
        _id: 'obs-bp-1',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'blood_pressure',
        title: 'Blood Pressure',
        value: '122/78',
        unit: 'mmHg',
        numericValue: 122,
        systolic: 122,
        diastolic: 78,
        recordSource: 'manual',
        recordedBy: { name: 'Sarah Vance', role: 'caregiver' },
        recordedAt: new Date(now - 6 * day + 8 * 3600 * 1000).toISOString(),
        notes: 'Resting morning reading with Omron arm cuff.',
      },
      {
        _id: 'obs-bp-2',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'blood_pressure',
        title: 'Blood Pressure',
        value: '124/80',
        unit: 'mmHg',
        numericValue: 124,
        systolic: 124,
        diastolic: 80,
        recordSource: 'manual',
        recordedBy: { name: 'Sarah Vance', role: 'caregiver' },
        recordedAt: new Date(now - 5 * day + 8 * 3600 * 1000).toISOString(),
        notes: 'Seated, resting 5 minutes before cuff inflation.',
      },
      {
        _id: 'obs-bp-3',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'blood_pressure',
        title: 'Blood Pressure',
        value: '128/82',
        unit: 'mmHg',
        numericValue: 128,
        systolic: 128,
        diastolic: 82,
        recordSource: 'manual',
        recordedBy: { name: 'Nurse Marcus Bell, RN', role: 'caregiver' },
        recordedAt: new Date(now - 4 * day + 14 * 3600 * 1000).toISOString(),
        notes: 'Afternoon reading during home visit.',
      },
      {
        _id: 'obs-bp-4',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'blood_pressure',
        title: 'Blood Pressure',
        value: '120/76',
        unit: 'mmHg',
        numericValue: 120,
        systolic: 120,
        diastolic: 76,
        recordSource: 'verified_medical',
        recordedBy: { name: 'Dr. Robert Chen, MD', role: 'caregiver' },
        recordedAt: new Date(now - 3 * day + 10 * 3600 * 1000).toISOString(),
        notes: 'Clinical exam reading with calibrated sphygmomanometer.',
      },
      {
        _id: 'obs-bp-5',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'blood_pressure',
        title: 'Blood Pressure',
        value: '121/77',
        unit: 'mmHg',
        numericValue: 121,
        systolic: 121,
        diastolic: 77,
        recordSource: 'manual',
        recordedBy: { name: 'Sarah Vance', role: 'caregiver' },
        recordedAt: new Date(now - 2 * day + 8 * 3600 * 1000).toISOString(),
        notes: 'Calm morning reading.',
      },
      {
        _id: 'obs-bp-6',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'blood_pressure',
        title: 'Blood Pressure',
        value: '122/78',
        unit: 'mmHg',
        numericValue: 122,
        systolic: 122,
        diastolic: 78,
        recordSource: 'manual',
        recordedBy: { name: 'Sarah Vance', role: 'caregiver' },
        recordedAt: new Date(now - 3 * 3600 * 1000).toISOString(),
        notes: 'Morning reading before Lisinopril.',
      },

      // Blood Sugar
      {
        _id: 'obs-bs-1',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'blood_sugar',
        title: 'Blood Sugar',
        value: '108',
        unit: 'mg/dL',
        numericValue: 108,
        recordSource: 'manual',
        recordedBy: { name: 'Sarah Vance', role: 'caregiver' },
        recordedAt: new Date(now - 5 * day + 7 * 3600 * 1000).toISOString(),
        notes: 'Fasting morning fingerstick.',
      },
      {
        _id: 'obs-bs-2',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'blood_sugar',
        title: 'Blood Sugar',
        value: '112',
        unit: 'mg/dL',
        numericValue: 112,
        recordSource: 'manual',
        recordedBy: { name: 'Sarah Vance', role: 'caregiver' },
        recordedAt: new Date(now - 4 * day + 7 * 3600 * 1000).toISOString(),
        notes: 'Fasting reading.',
      },
      {
        _id: 'obs-bs-3',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'blood_sugar',
        title: 'Blood Sugar',
        value: '104',
        unit: 'mg/dL',
        numericValue: 104,
        recordSource: 'manual',
        recordedBy: { name: 'Sarah Vance', role: 'caregiver' },
        recordedAt: new Date(now - 2 * day + 7 * 3600 * 1000).toISOString(),
        notes: 'Fasting reading.',
      },
      {
        _id: 'obs-bs-4',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'blood_sugar',
        title: 'Blood Sugar',
        value: '106',
        unit: 'mg/dL',
        numericValue: 106,
        recordSource: 'manual',
        recordedBy: { name: 'Sarah Vance', role: 'caregiver' },
        recordedAt: new Date(now - 4 * 3600 * 1000).toISOString(),
        notes: 'Fasting reading today.',
      },

      // Weight
      {
        _id: 'obs-wt-1',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'weight',
        title: 'Body Weight',
        value: '142.0',
        unit: 'lbs',
        numericValue: 142.0,
        recordSource: 'manual',
        recordedBy: { name: 'Sarah Vance', role: 'caregiver' },
        recordedAt: new Date(now - 6 * day + 7 * 3600 * 1000).toISOString(),
        notes: 'Morning weight on digital scale.',
      },
      {
        _id: 'obs-wt-2',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'weight',
        title: 'Body Weight',
        value: '141.8',
        unit: 'lbs',
        numericValue: 141.8,
        recordSource: 'manual',
        recordedBy: { name: 'Sarah Vance', role: 'caregiver' },
        recordedAt: new Date(now - 3 * day + 7 * 3600 * 1000).toISOString(),
        notes: 'Stable weight.',
      },
      {
        _id: 'obs-wt-3',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'weight',
        title: 'Body Weight',
        value: '142.2',
        unit: 'lbs',
        numericValue: 142.2,
        recordSource: 'manual',
        recordedBy: { name: 'Sarah Vance', role: 'caregiver' },
        recordedAt: new Date(now - 4 * 3600 * 1000).toISOString(),
        notes: 'Morning weight today.',
      },

      // Heart Rate
      {
        _id: 'obs-hr-1',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'heart_rate',
        title: 'Heart Rate',
        value: '70',
        unit: 'bpm',
        numericValue: 70,
        recordSource: 'manual',
        recordedBy: { name: 'Sarah Vance', role: 'caregiver' },
        recordedAt: new Date(now - 5 * day + 8 * 3600 * 1000).toISOString(),
        notes: 'Resting radial pulse.',
      },
      {
        _id: 'obs-hr-2',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'heart_rate',
        title: 'Heart Rate',
        value: '74',
        unit: 'bpm',
        numericValue: 74,
        recordSource: 'manual',
        recordedBy: { name: 'Sarah Vance', role: 'caregiver' },
        recordedAt: new Date(now - 2 * day + 8 * 3600 * 1000).toISOString(),
        notes: 'Resting pulse.',
      },
      {
        _id: 'obs-hr-3',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'heart_rate',
        title: 'Heart Rate',
        value: '72',
        unit: 'bpm',
        numericValue: 72,
        recordSource: 'manual',
        recordedBy: { name: 'Sarah Vance', role: 'caregiver' },
        recordedAt: new Date(now - 3 * 3600 * 1000).toISOString(),
        notes: 'Morning pulse.',
      },

      // General Wellness Status
      {
        _id: 'obs-gw-1',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'general_wellness',
        title: 'General Wellness Status',
        value: 'Good & active',
        unit: 'status',
        recordSource: 'manual',
        recordedBy: { name: 'Grandma Eleanor', role: 'elderly' },
        recordedAt: new Date(now - 24 * 3600 * 1000).toISOString(),
        notes: 'Enjoyed afternoon knitting club.',
      },
      {
        _id: 'obs-gw-2',
        elderlyUserId: elderlyId || 'elderly-1',
        metricType: 'general_wellness',
        title: 'General Wellness Status',
        value: 'Great',
        unit: 'status',
        recordSource: 'manual',
        recordedBy: { name: 'Grandma Eleanor', role: 'elderly' },
        recordedAt: new Date(now - 2 * 3600 * 1000).toISOString(),
        notes: 'Feeling energetic after good night sleep.',
      },
    ],
    todayWellness: {
      feeling: 'good',
      energyLevel: 'moderate',
      sleepQuality: 'good',
      waterIntakeGlasses: 5,
      waterTarget: 8,
      streak: 12,
      notes: 'Had a calm breakfast and went out for fresh air.',
      recordedAt: new Date(now - 2 * 3600 * 1000).toISOString(),
      recordedBy: 'Grandma Eleanor',
    },
  };

  localStorage.setItem(key, JSON.stringify(defaultState));
  return defaultState;
};

const saveLocalStorageData = (elderlyId, state) => {
  const key = `${STORAGE_PREFIX}${elderlyId || 'default'}`;
  localStorage.setItem(key, JSON.stringify(state));
};

export const getHealthProfile = async (elderlyId) => {
  try {
    const res = await api.get(`/health-profile/${elderlyId}`);
    if (res.data) return res.data;
  } catch (err) {
    console.warn('API error fetching health profile, using local state', err);
  }

  const local = getLocalStorageData(elderlyId);
  return {
    profile: local.profile,
    resident: {
      _id: elderlyId || 'elderly-1',
      name: 'Grandma Eleanor Vance',
      email: 'eleanor.vance@carecircle.org',
      phone: '+1 (555) 234-5678',
      bloodType: local.profile.bloodType,
    },
    disclaimer:
      'Health observation data is recorded for informational tracking purposes only. CareCircle does not provide automatic medical diagnosis or treatment recommendations. Always consult a licensed healthcare professional for clinical decisions.',
  };
};

export const updateHealthProfile = async (elderlyId, data) => {
  try {
    const res = await api.put(`/health-profile/${elderlyId}`, data);
    if (res.data) return res.data;
  } catch (err) {
    console.warn('API error updating health profile, updating local state', err);
  }

  const local = getLocalStorageData(elderlyId);
  local.profile = { ...local.profile, ...data };
  saveLocalStorageData(elderlyId, local);
  return local.profile;
};

export const addMedicalCondition = async (elderlyId, conditionData) => {
  try {
    const res = await api.post(`/health-profile/${elderlyId}/conditions`, conditionData);
    if (res.data) return res.data;
  } catch (err) {
    console.warn('API error adding medical condition, updating local state', err);
  }

  const local = getLocalStorageData(elderlyId);
  const newCond = {
    _id: `cond-${Date.now()}`,
    name: conditionData.name,
    diagnosedDate: conditionData.diagnosedDate || '',
    status: conditionData.status || 'active',
    source: conditionData.source || 'manual',
    verifiedBy: conditionData.source === 'verified_medical' ? conditionData.verifiedBy || 'Physician' : '',
    notes: conditionData.notes || '',
    createdAt: new Date().toISOString(),
  };
  local.profile.medicalConditions.push(newCond);
  saveLocalStorageData(elderlyId, local);
  return local.profile;
};

export const removeMedicalCondition = async (elderlyId, conditionId) => {
  try {
    const res = await api.delete(`/health-profile/${elderlyId}/conditions/${conditionId}`);
    if (res.data) return res.data;
  } catch (err) {
    console.warn('API error removing medical condition, updating local state', err);
  }

  const local = getLocalStorageData(elderlyId);
  local.profile.medicalConditions = local.profile.medicalConditions.filter(
    (c) => c._id !== conditionId
  );
  saveLocalStorageData(elderlyId, local);
  return local.profile;
};

export const addAllergy = async (elderlyId, allergyData) => {
  try {
    const res = await api.post(`/health-profile/${elderlyId}/allergies`, allergyData);
    if (res.data) return res.data;
  } catch (err) {
    console.warn('API error adding allergy, updating local state', err);
  }

  const local = getLocalStorageData(elderlyId);
  const newAllergy = {
    _id: `all-${Date.now()}`,
    allergen: allergyData.allergen,
    severity: allergyData.severity || 'moderate',
    reaction: allergyData.reaction || '',
    source: allergyData.source || 'manual',
    verifiedBy: allergyData.source === 'verified_medical' ? allergyData.verifiedBy || 'Physician' : '',
    createdAt: new Date().toISOString(),
  };
  local.profile.allergies.push(newAllergy);
  saveLocalStorageData(elderlyId, local);
  return local.profile;
};

export const removeAllergy = async (elderlyId, allergyId) => {
  try {
    const res = await api.delete(`/health-profile/${elderlyId}/allergies/${allergyId}`);
    if (res.data) return res.data;
  } catch (err) {
    console.warn('API error removing allergy, updating local state', err);
  }

  const local = getLocalStorageData(elderlyId);
  local.profile.allergies = local.profile.allergies.filter((a) => a._id !== allergyId);
  saveLocalStorageData(elderlyId, local);
  return local.profile;
};

export const addEmergencyContact = async (elderlyId, contactData) => {
  try {
    const res = await api.post(`/health-profile/${elderlyId}/emergency-contacts`, contactData);
    if (res.data) return res.data;
  } catch (err) {
    console.warn('API error adding emergency contact, updating local state', err);
  }

  const local = getLocalStorageData(elderlyId);
  if (contactData.isPrimary) {
    local.profile.emergencyContacts.forEach((c) => {
      c.isPrimary = false;
    });
  }
  const newContact = {
    _id: `ec-${Date.now()}`,
    name: contactData.name,
    relationship: contactData.relationship || '',
    phone: contactData.phone,
    email: contactData.email || '',
    address: contactData.address || '',
    isPrimary: Boolean(contactData.isPrimary),
  };
  local.profile.emergencyContacts.push(newContact);
  saveLocalStorageData(elderlyId, local);
  return local.profile;
};

export const addDoctorInformation = async (elderlyId, docData) => {
  try {
    const res = await api.post(`/health-profile/${elderlyId}/doctors`, docData);
    if (res.data) return res.data;
  } catch (err) {
    console.warn('API error adding doctor info, updating local state', err);
  }

  const local = getLocalStorageData(elderlyId);
  if (docData.isPrimaryCare) {
    local.profile.doctorInformation.forEach((d) => {
      d.isPrimaryCare = false;
    });
  }
  const newDoc = {
    _id: `doc-${Date.now()}`,
    name: docData.name,
    specialty: docData.specialty || 'General Practitioner',
    clinic: docData.clinic || '',
    phone: docData.phone || '',
    email: docData.email || '',
    address: docData.address || '',
    isPrimaryCare: Boolean(docData.isPrimaryCare),
  };
  local.profile.doctorInformation.push(newDoc);
  saveLocalStorageData(elderlyId, local);
  return local.profile;
};

/**
 * Manually record an observation:
 * - elderlyUserId
 * - metricType
 * - value
 * - unit
 * - recordedAt
 * - recordedBy
 * - optional notes
 */
export const recordObservation = async (elderlyId, observationData) => {
  try {
    const res = await api.post(`/health-profile/${elderlyId}/observations`, observationData);
    if (res.data) return res.data;
  } catch (err) {
    console.warn('API error recording health observation, updating local state', err);
  }

  const local = getLocalStorageData(elderlyId);
  let parsedSystolic = observationData.systolic !== undefined ? Number(observationData.systolic) : null;
  let parsedDiastolic = observationData.diastolic !== undefined ? Number(observationData.diastolic) : null;
  let numVal = observationData.numericValue !== undefined ? Number(observationData.numericValue) : null;

  if (observationData.metricType === 'blood_pressure') {
    const parts = String(observationData.value).split('/');
    if (parts.length === 2) {
      parsedSystolic = parsedSystolic ?? parseInt(parts[0].trim(), 10);
      parsedDiastolic = parsedDiastolic ?? parseInt(parts[1].trim(), 10);
      numVal = parsedSystolic;
    }
  } else if (numVal === null && !isNaN(parseFloat(observationData.value))) {
    numVal = parseFloat(observationData.value);
  }

  const newObs = {
    _id: `obs-${Date.now()}`,
    elderlyUserId: elderlyId || 'elderly-1',
    metricType: observationData.metricType,
    title: observationData.title || observationData.metricType.replace('_', ' ').toUpperCase(),
    value: String(observationData.value),
    numericValue: numVal,
    systolic: parsedSystolic,
    diastolic: parsedDiastolic,
    unit: observationData.unit || '',
    recordSource: observationData.recordSource || 'manual',
    notes: observationData.notes || '',
    recordedAt: observationData.recordedAt || new Date().toISOString(),
    recordedBy: {
      name: observationData.authorName || 'Current User',
      role: observationData.authorRole || 'caregiver',
    },
  };

  local.observations.unshift(newObs);
  saveLocalStorageData(elderlyId, local);

  return {
    observation: newObs,
    disclaimer:
      'Health observation data is recorded for informational tracking purposes only. CareCircle does not provide automatic medical diagnosis or treatment recommendations.',
  };
};

export const getHistoricalObservations = async (elderlyId, filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.metricType) params.append('metricType', filters.metricType);
    if (filters.recordSource) params.append('recordSource', filters.recordSource);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.page) params.append('page', String(filters.page));

    const res = await api.get(`/health-profile/${elderlyId}/observations?${params.toString()}`);
    if (res.data) return res.data;
  } catch (err) {
    console.warn('API error fetching historical observations, using local state', err);
  }

  const local = getLocalStorageData(elderlyId);
  let filtered = [...local.observations];

  if (filters.metricType && filters.metricType !== 'all') {
    filtered = filtered.filter(
      (o) => o.metricType === filters.metricType || o.type === filters.metricType
    );
  }

  if (filters.recordSource && filters.recordSource !== 'all') {
    filtered = filtered.filter((o) => (o.recordSource || 'manual') === filters.recordSource);
  }

  if (filters.startDate) {
    filtered = filtered.filter((o) => new Date(o.recordedAt) >= new Date(filters.startDate));
  }
  if (filters.endDate) {
    filtered = filtered.filter((o) => new Date(o.recordedAt) <= new Date(filters.endDate));
  }

  // Sort chronological descending
  filtered.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));

  return {
    observations: filtered,
    pagination: {
      total: filtered.length,
      page: 1,
      limit: filtered.length,
      totalPages: 1,
    },
    disclaimer:
      'Health observation data is recorded for informational tracking purposes only. CareCircle does not provide automatic medical diagnosis or treatment recommendations.',
  };
};

export const getHistoricalTrends = async (elderlyId, params = {}) => {
  try {
    const q = new URLSearchParams();
    if (params.metricType) q.append('metricType', params.metricType);
    if (params.days) q.append('days', String(params.days));
    if (params.startDate) q.append('startDate', params.startDate);
    if (params.endDate) q.append('endDate', params.endDate);

    const res = await api.get(`/health-profile/${elderlyId}/trends?${q.toString()}`);
    if (res.data) return res.data;
  } catch (err) {
    console.warn('API error fetching historical trends, using local state', err);
  }

  const local = getLocalStorageData(elderlyId);
  const metricType = params.metricType || 'blood_pressure';
  const days = params.days ? parseInt(params.days, 10) : 30;

  const now = new Date();
  const start = params.startDate
    ? new Date(params.startDate)
    : new Date(now.getTime() - days * 24 * 3600 * 1000);
  const end = params.endDate ? new Date(params.endDate) : now;

  let filtered = local.observations.filter((obs) => {
    const isMatchingMetric =
      metricType === 'all' || obs.metricType === metricType || obs.type === metricType;
    const obsDate = new Date(obs.recordedAt);
    return isMatchingMetric && obsDate >= start && obsDate <= end;
  });

  // Chronological ascending for trend chart plotting
  filtered.sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));

  const measurements = filtered.map((obs) => ({
    id: obs._id,
    _id: obs._id,
    metricType: obs.metricType || obs.type,
    value: obs.value,
    numericValue: obs.numericValue,
    systolic: obs.systolic,
    diastolic: obs.diastolic,
    unit: obs.unit,
    recordSource: obs.recordSource || 'manual',
    isManual: (obs.recordSource || 'manual') === 'manual',
    isVerifiedMedical: obs.recordSource === 'verified_medical',
    recordedAt: obs.recordedAt,
    recordedBy: obs.recordedBy?.name || 'Care Team',
    notes: obs.notes || '',
  }));

  let stats = null;
  const numPoints = measurements.filter((m) => typeof m.numericValue === 'number' && !isNaN(m.numericValue));
  if (numPoints.length > 0) {
    const vals = numPoints.map((p) => p.numericValue);
    const sum = vals.reduce((a, b) => a + b, 0);
    stats = {
      count: numPoints.length,
      min: Math.min(...vals),
      max: Math.max(...vals),
      average: Math.round((sum / vals.length) * 10) / 10,
      unit: measurements[0]?.unit || '',
    };
  }

  let bpStats = null;
  if (metricType === 'blood_pressure') {
    const bpPoints = measurements.filter((m) => m.systolic !== null && m.diastolic !== null);
    if (bpPoints.length > 0) {
      const avgSys = Math.round(bpPoints.reduce((acc, p) => acc + p.systolic, 0) / bpPoints.length);
      const avgDia = Math.round(bpPoints.reduce((acc, p) => acc + p.diastolic, 0) / bpPoints.length);
      bpStats = {
        count: bpPoints.length,
        averageSystolic: avgSys,
        averageDiastolic: avgDia,
        latest: `${bpPoints[bpPoints.length - 1].systolic}/${bpPoints[bpPoints.length - 1].diastolic} mmHg`,
      };
    }
  }

  return {
    metricType,
    dateRange: { start, end, daysCount: days },
    totalReadingsCount: measurements.length,
    manualReadingsCount: measurements.filter((m) => m.isManual).length,
    verifiedReadingsCount: measurements.filter((m) => m.isVerifiedMedical).length,
    measurements, // Note: Contains only true recorded measurements; NO missing measurements invented
    stats,
    bpStats,
    disclaimer:
      'Health observation data is recorded for informational tracking purposes only. CareCircle does not provide automatic medical diagnosis or treatment recommendations. Always consult a licensed healthcare professional.',
  };
};

export const recordDailyWellnessCheckIn = async (elderlyId, checkinData) => {
  try {
    const res = await api.post(`/health-profile/${elderlyId}/wellness-checkin`, checkinData);
    if (res.data) return res.data;
  } catch (err) {
    console.warn('API error recording daily wellness checkin, updating local state', err);
  }

  const local = getLocalStorageData(elderlyId);
  const now = new Date();
  local.todayWellness = {
    feeling: checkinData.feeling,
    energyLevel: checkinData.energyLevel || 'moderate',
    sleepQuality: checkinData.sleepQuality || 'good',
    waterIntakeGlasses: checkinData.waterIntakeGlasses || 0,
    waterTarget: 8,
    streak: (local.todayWellness?.streak || 0) + 1,
    notes: checkinData.notes || '',
    recordedAt: now.toISOString(),
    recordedBy: checkinData.authorName || 'Resident',
  };

  // Add observation record
  local.observations.unshift({
    _id: `obs-gw-${Date.now()}`,
    elderlyUserId: elderlyId || 'elderly-1',
    metricType: 'general_wellness',
    title: 'Daily Wellness Check-in',
    value: checkinData.feeling,
    unit: 'status',
    recordSource: 'manual',
    recordedBy: { name: checkinData.authorName || 'Resident', role: 'elderly' },
    recordedAt: now.toISOString(),
    notes: `Energy: ${checkinData.energyLevel}, Sleep: ${checkinData.sleepQuality}. ${checkinData.notes || ''}`.trim(),
  });

  saveLocalStorageData(elderlyId, local);

  return {
    checkIn: local.todayWellness,
    disclaimer:
      'Wellness self-reports are tracked for personal well-being awareness and do not constitute clinical diagnosis.',
  };
};

export const getTodayWellnessCheckIn = async (elderlyId) => {
  try {
    const res = await api.get(`/health-profile/${elderlyId}/wellness-checkin/today`);
    if (res.data) return res.data;
  } catch (err) {
    console.warn('API error fetching today wellness checkin, using local state', err);
  }

  const local = getLocalStorageData(elderlyId);
  return {
    todayCheckIn: local.todayWellness,
    hasCheckedInToday: Boolean(local.todayWellness),
    recentDaysCount: local.todayWellness?.streak || 7,
    disclaimer:
      'Health observation data is recorded for informational tracking purposes only. CareCircle does not provide automatic medical diagnosis or treatment recommendations.',
  };
};

export default {
  getHealthProfile,
  updateHealthProfile,
  addMedicalCondition,
  removeMedicalCondition,
  addAllergy,
  removeAllergy,
  addEmergencyContact,
  addDoctorInformation,
  recordObservation,
  getHistoricalObservations,
  getHistoricalTrends,
  recordDailyWellnessCheckIn,
  getTodayWellnessCheckIn,
};
