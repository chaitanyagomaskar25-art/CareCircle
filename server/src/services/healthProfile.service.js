import { HealthProfile } from '../models/healthProfile.model.js';
import { HealthObservation } from '../models/healthObservation.model.js';
import { WellnessCheckIn } from '../models/wellnessCheckIn.model.js';
import { User } from '../models/user.model.js';
import { CareAuditLog } from '../models/careAuditLog.model.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyCaregiverAccess } from '../middlewares/careCircleAuth.middleware.js';

const MEDICAL_DISCLAIMER =
  'Health observation data is recorded for informational tracking purposes only. CareCircle does not provide automatic medical diagnosis or treatment recommendations. Always consult a licensed healthcare professional for clinical decisions.';

/**
 * Get or initialize a resident's Health Profile
 */
export const getHealthProfile = async (elderlyUserId, requester, ipAddress = 'unknown') => {
  await verifyCaregiverAccess(elderlyUserId, requester, 'view_health_records', ipAddress);

  const senior = await User.findById(elderlyUserId).select('name email phone profileImage accountStatus timezone');
  if (!senior) {
    throw ApiError.notFound('Elderly resident not found.');
  }

  let profile = await HealthProfile.findOne({ elderlyUserId })
    .populate('lastUpdatedBy', 'name role');

  if (!profile) {
    // Initialize default profile
    profile = await HealthProfile.create({
      elderlyUserId,
      medicalConditions: [],
      allergies: [],
      emergencyContacts: [],
      doctorInformation: [],
      bloodType: '',
      notes: '',
      lastUpdatedBy: requester._id,
    });
  }

  return {
    profile,
    resident: senior,
    disclaimer: MEDICAL_DISCLAIMER,
  };
};

/**
 * Update general Health Profile metadata (bloodType, notes)
 */
export const updateHealthProfile = async (elderlyUserId, data, requester, ipAddress = 'unknown') => {
  await verifyCaregiverAccess(elderlyUserId, requester, 'add_health_observations', ipAddress);

  let profile = await HealthProfile.findOne({ elderlyUserId });
  if (!profile) {
    profile = new HealthProfile({ elderlyUserId });
  }

  if (data.bloodType !== undefined) profile.bloodType = data.bloodType;
  if (data.notes !== undefined) profile.notes = data.notes;
  profile.lastUpdatedBy = requester._id;

  await profile.save();

  await CareAuditLog.create({
    elderlyUserId,
    performedBy: requester._id,
    action: 'HEALTH_PROFILE_UPDATED',
    details: { bloodType: data.bloodType },
    ipAddress,
  });

  return profile;
};

/**
 * Add a medical condition
 */
export const addMedicalCondition = async (elderlyUserId, conditionData, requester, ipAddress = 'unknown') => {
  await verifyCaregiverAccess(elderlyUserId, requester, 'add_health_observations', ipAddress);

  if (!conditionData.name || !conditionData.name.trim()) {
    throw ApiError.badRequest('Condition name is required.');
  }

  let profile = await HealthProfile.findOne({ elderlyUserId });
  if (!profile) {
    profile = await HealthProfile.create({ elderlyUserId, medicalConditions: [] });
  }

  const newCondition = {
    name: conditionData.name.trim(),
    diagnosedDate: conditionData.diagnosedDate || '',
    status: conditionData.status || 'active',
    source: conditionData.source === 'verified_medical' ? 'verified_medical' : 'manual',
    verifiedBy: conditionData.source === 'verified_medical' ? conditionData.verifiedBy || requester.name : '',
    notes: conditionData.notes || '',
    createdAt: new Date(),
  };

  profile.medicalConditions.push(newCondition);
  profile.lastUpdatedBy = requester._id;
  await profile.save();

  await CareAuditLog.create({
    elderlyUserId,
    performedBy: requester._id,
    action: 'MEDICAL_CONDITION_RECORDED',
    details: { name: newCondition.name, source: newCondition.source },
    ipAddress,
  });

  return profile;
};

/**
 * Remove a medical condition
 */
export const removeMedicalCondition = async (elderlyUserId, conditionId, requester, ipAddress = 'unknown') => {
  await verifyCaregiverAccess(elderlyUserId, requester, 'add_health_observations', ipAddress);

  const profile = await HealthProfile.findOne({ elderlyUserId });
  if (!profile) {
    throw ApiError.notFound('Health profile not found.');
  }

  profile.medicalConditions = profile.medicalConditions.filter(
    (c) => c._id.toString() !== conditionId.toString()
  );
  profile.lastUpdatedBy = requester._id;
  await profile.save();

  return profile;
};

/**
 * Add an allergy
 */
export const addAllergy = async (elderlyUserId, allergyData, requester, ipAddress = 'unknown') => {
  await verifyCaregiverAccess(elderlyUserId, requester, 'add_health_observations', ipAddress);

  if (!allergyData.allergen || !allergyData.allergen.trim()) {
    throw ApiError.badRequest('Allergen name is required.');
  }

  let profile = await HealthProfile.findOne({ elderlyUserId });
  if (!profile) {
    profile = await HealthProfile.create({ elderlyUserId, allergies: [] });
  }

  const newAllergy = {
    allergen: allergyData.allergen.trim(),
    severity: allergyData.severity || 'moderate',
    reaction: allergyData.reaction || '',
    source: allergyData.source === 'verified_medical' ? 'verified_medical' : 'manual',
    verifiedBy: allergyData.source === 'verified_medical' ? allergyData.verifiedBy || requester.name : '',
    createdAt: new Date(),
  };

  profile.allergies.push(newAllergy);
  profile.lastUpdatedBy = requester._id;
  await profile.save();

  await CareAuditLog.create({
    elderlyUserId,
    performedBy: requester._id,
    action: 'ALLERGY_RECORDED',
    details: { allergen: newAllergy.allergen, severity: newAllergy.severity },
    ipAddress,
  });

  return profile;
};

/**
 * Remove an allergy
 */
export const removeAllergy = async (elderlyUserId, allergyId, requester, ipAddress = 'unknown') => {
  await verifyCaregiverAccess(elderlyUserId, requester, 'add_health_observations', ipAddress);

  const profile = await HealthProfile.findOne({ elderlyUserId });
  if (!profile) {
    throw ApiError.notFound('Health profile not found.');
  }

  profile.allergies = profile.allergies.filter((a) => a._id.toString() !== allergyId.toString());
  profile.lastUpdatedBy = requester._id;
  await profile.save();

  return profile;
};

/**
 * Add emergency contact
 */
export const addEmergencyContact = async (elderlyUserId, contactData, requester, ipAddress = 'unknown') => {
  await verifyCaregiverAccess(elderlyUserId, requester, 'add_health_observations', ipAddress);

  if (!contactData.name || !contactData.phone) {
    throw ApiError.badRequest('Contact name and phone are required.');
  }

  let profile = await HealthProfile.findOne({ elderlyUserId });
  if (!profile) {
    profile = await HealthProfile.create({ elderlyUserId, emergencyContacts: [] });
  }

  if (contactData.isPrimary) {
    profile.emergencyContacts.forEach((c) => {
      c.isPrimary = false;
    });
  }

  profile.emergencyContacts.push({
    name: contactData.name.trim(),
    relationship: contactData.relationship || '',
    phone: contactData.phone.trim(),
    email: contactData.email || '',
    address: contactData.address || '',
    isPrimary: Boolean(contactData.isPrimary),
  });

  profile.lastUpdatedBy = requester._id;
  await profile.save();

  return profile;
};

/**
 * Add doctor information
 */
export const addDoctorInformation = async (elderlyUserId, docData, requester, ipAddress = 'unknown') => {
  await verifyCaregiverAccess(elderlyUserId, requester, 'add_health_observations', ipAddress);

  if (!docData.name || !docData.name.trim()) {
    throw ApiError.badRequest('Doctor name is required.');
  }

  let profile = await HealthProfile.findOne({ elderlyUserId });
  if (!profile) {
    profile = await HealthProfile.create({ elderlyUserId, doctorInformation: [] });
  }

  if (docData.isPrimaryCare) {
    profile.doctorInformation.forEach((d) => {
      d.isPrimaryCare = false;
    });
  }

  profile.doctorInformation.push({
    name: docData.name.trim(),
    specialty: docData.specialty || 'General Practitioner',
    clinic: docData.clinic || '',
    phone: docData.phone || '',
    email: docData.email || '',
    address: docData.address || '',
    isPrimaryCare: Boolean(docData.isPrimaryCare),
  });

  profile.lastUpdatedBy = requester._id;
  await profile.save();

  return profile;
};

/**
 * Manually record a health observation (blood pressure, blood sugar, weight, heart rate, general wellness)
 *
 * Every observation must include:
 * - elderlyUserId
 * - metricType
 * - value
 * - unit
 * - recordedAt
 * - recordedBy
 * - optional notes
 */
export const recordObservation = async ({
  elderlyUserId,
  metricType,
  value,
  unit,
  recordedAt,
  recordedBy,
  notes,
  recordSource = 'manual',
  title,
  systolic,
  diastolic,
  numericValue,
  ipAddress = 'unknown',
}) => {
  await verifyCaregiverAccess(elderlyUserId, recordedBy, 'add_health_observations', ipAddress);

  if (!elderlyUserId) {
    throw ApiError.badRequest('elderlyUserId is required.');
  }

  const validMetricType = metricType || 'other';
  if (!value && value !== 0) {
    throw ApiError.badRequest('Observation value is required.');
  }

  // Parse blood pressure components if applicable
  let numVal = numericValue !== undefined && numericValue !== null ? Number(numericValue) : null;
  let parsedSystolic = systolic !== undefined && systolic !== null ? Number(systolic) : null;
  let parsedDiastolic = diastolic !== undefined && diastolic !== null ? Number(diastolic) : null;

  if (validMetricType === 'blood_pressure') {
    const parts = String(value).split('/');
    if (parts.length === 2) {
      parsedSystolic = parsedSystolic ?? parseInt(parts[0].trim(), 10);
      parsedDiastolic = parsedDiastolic ?? parseInt(parts[1].trim(), 10);
      numVal = parsedSystolic;
    }
  } else if (numVal === null && !isNaN(parseFloat(value))) {
    numVal = parseFloat(value);
  }

  // Default display title
  let displayTitle = title;
  if (!displayTitle) {
    switch (validMetricType) {
      case 'blood_pressure':
        displayTitle = 'Blood Pressure';
        break;
      case 'blood_sugar':
      case 'blood_glucose':
        displayTitle = 'Blood Sugar';
        break;
      case 'heart_rate':
        displayTitle = 'Heart Rate';
        break;
      case 'weight':
        displayTitle = 'Body Weight';
        break;
      case 'general_wellness':
        displayTitle = 'General Wellness Status';
        break;
      default:
        displayTitle = 'Health Measurement';
    }
  }

  // Explicitly note record source (manual vs verified medical)
  const source = recordSource === 'verified_medical' ? 'verified_medical' : 'manual';

  const observation = await HealthObservation.create({
    elderlyUserId,
    recordedBy: recordedBy._id,
    metricType: validMetricType,
    type: validMetricType,
    title: displayTitle,
    value: String(value).trim(),
    numericValue: numVal,
    systolic: parsedSystolic,
    diastolic: parsedDiastolic,
    unit: unit ? String(unit).trim() : '',
    recordSource: source,
    notes: notes ? String(notes).trim() : '',
    recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
  });

  const populated = await HealthObservation.findById(observation._id)
    .populate('recordedBy', 'name role')
    .populate('elderlyUserId', 'name');

  // Audit Log
  await CareAuditLog.create({
    elderlyUserId,
    performedBy: recordedBy._id,
    action: 'HEALTH_OBSERVATION_RECORDED',
    details: {
      observationId: observation._id,
      metricType: validMetricType,
      value: observation.value,
      source,
    },
    ipAddress,
  });

  return {
    observation: populated,
    disclaimer: MEDICAL_DISCLAIMER,
  };
};

/**
 * Query historical health observations with filters
 */
export const getHistoricalObservations = async ({
  elderlyUserId,
  requester,
  metricType,
  recordSource,
  startDate,
  endDate,
  limit = 100,
  page = 1,
  ipAddress = 'unknown',
}) => {
  await verifyCaregiverAccess(elderlyUserId, requester, 'view_health_records', ipAddress);

  const query = { elderlyUserId };

  if (metricType && metricType !== 'all') {
    if (metricType === 'blood_sugar') {
      query.$or = [{ metricType: 'blood_sugar' }, { metricType: 'blood_glucose' }, { type: 'blood_glucose' }];
    } else {
      query.$or = [{ metricType }, { type: metricType }];
    }
  }

  if (recordSource && recordSource !== 'all') {
    query.recordSource = recordSource;
  }

  if (startDate || endDate) {
    query.recordedAt = {};
    if (startDate) query.recordedAt.$gte = new Date(startDate);
    if (endDate) query.recordedAt.$lte = new Date(endDate);
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

  const [observations, total] = await Promise.all([
    HealthObservation.find(query)
      .populate('recordedBy', 'name role email')
      .sort({ recordedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    HealthObservation.countDocuments(query),
  ]);

  return {
    observations,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
    },
    disclaimer: MEDICAL_DISCLAIMER,
  };
};

/**
 * Historical Trends Analysis
 *
 * IMPORTANT RULES:
 * - Does not automatically diagnose conditions
 * - Does not generate treatment recommendations
 * - Does not invent missing measurements (only measured points returned)
 * - Distinguishes manual recordings from verified medical records
 */
export const getHistoricalTrends = async ({
  elderlyUserId,
  requester,
  metricType = 'blood_pressure',
  days = 30,
  startDate,
  endDate,
  ipAddress = 'unknown',
}) => {
  await verifyCaregiverAccess(elderlyUserId, requester, 'view_health_records', ipAddress);

  const query = { elderlyUserId };

  if (metricType && metricType !== 'all') {
    if (metricType === 'blood_sugar') {
      query.$or = [{ metricType: 'blood_sugar' }, { metricType: 'blood_glucose' }, { type: 'blood_glucose' }];
    } else {
      query.$or = [{ metricType }, { type: metricType }];
    }
  }

  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate
    ? new Date(startDate)
    : new Date(end.getTime() - parseInt(days, 10) * 24 * 3600 * 1000);

  query.recordedAt = { $gte: start, $lte: end };

  // Fetch only recorded entries in chronological order
  const rawObservations = await HealthObservation.find(query)
    .populate('recordedBy', 'name role')
    .sort({ recordedAt: 1 });

  // Distinguish records and extract true points without interpolation
  const points = rawObservations.map((obs) => {
    return {
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
      recordedBy: obs.recordedBy?.name || 'Authorized Member',
      role: obs.recordedBy?.role || 'user',
      notes: obs.notes || '',
    };
  });

  // Calculate descriptive summary stats ONLY if data exists (never inventing missing numbers)
  let stats = null;
  const numericPoints = points.filter((p) => typeof p.numericValue === 'number' && !isNaN(p.numericValue));
  if (numericPoints.length > 0) {
    const vals = numericPoints.map((p) => p.numericValue);
    const sum = vals.reduce((a, b) => a + b, 0);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = Math.round((sum / vals.length) * 10) / 10;
    stats = {
      count: numericPoints.length,
      min,
      max,
      average: avg,
      unit: points[0]?.unit || '',
      firstRecordedAt: points[0]?.recordedAt,
      lastRecordedAt: points[points.length - 1]?.recordedAt,
    };
  }

  // Blood pressure specific stats
  let bpStats = null;
  if (metricType === 'blood_pressure') {
    const bpPoints = points.filter((p) => p.systolic !== null && p.diastolic !== null);
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
    dateRange: { start, end, daysCount: parseInt(days, 10) },
    totalReadingsCount: points.length,
    manualReadingsCount: points.filter((p) => p.isManual).length,
    verifiedReadingsCount: points.filter((p) => p.isVerifiedMedical).length,
    measurements: points, // Exact recorded measurements only, no invented missing data
    stats,
    bpStats,
    disclaimer: MEDICAL_DISCLAIMER,
  };
};

/**
 * Record a Daily Wellness Check-in
 */
export const recordDailyWellnessCheckIn = async ({
  elderlyUserId,
  recordedBy,
  feeling,
  energyLevel = 'moderate',
  sleepQuality = 'good',
  waterIntakeGlasses = 0,
  notes = '',
  ipAddress = 'unknown',
}) => {
  await verifyCaregiverAccess(elderlyUserId, recordedBy, 'add_health_observations', ipAddress);

  if (!feeling) {
    throw ApiError.badRequest('Feeling state is required.');
  }

  const checkIn = await WellnessCheckIn.create({
    elderlyUserId,
    recordedBy: recordedBy._id,
    feeling,
    energyLevel,
    sleepQuality,
    waterIntakeGlasses: Number(waterIntakeGlasses) || 0,
    notes: notes || '',
    source: 'manual',
    recordedAt: new Date(),
  });

  // Also create a health observation for unified audit and longitudinal timeline
  await HealthObservation.create({
    elderlyUserId,
    recordedBy: recordedBy._id,
    metricType: 'general_wellness',
    type: 'general_wellness',
    title: 'Daily Wellness Check-in',
    value: feeling,
    unit: 'status',
    recordSource: 'manual',
    notes: `Energy: ${energyLevel}, Sleep: ${sleepQuality}, Water: ${waterIntakeGlasses} glasses. ${notes}`.trim(),
    recordedAt: checkIn.recordedAt,
  });

  await CareAuditLog.create({
    elderlyUserId,
    performedBy: recordedBy._id,
    action: 'WELLNESS_CHECK_IN_RECORDED',
    details: { feeling, energyLevel, sleepQuality, waterIntakeGlasses },
    ipAddress,
  });

  return {
    checkIn,
    disclaimer: MEDICAL_DISCLAIMER,
  };
};

/**
 * Get Today's Wellness Check-in
 */
export const getTodayWellnessCheckIn = async (elderlyUserId, requester, ipAddress = 'unknown') => {
  await verifyCaregiverAccess(elderlyUserId, requester, 'view_health_records', ipAddress);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todayCheckIn = await WellnessCheckIn.findOne({
    elderlyUserId,
    recordedAt: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate('recordedBy', 'name role')
    .sort({ recordedAt: -1 });

  // Get past 7 days checkins for streak calculation
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentCheckIns = await WellnessCheckIn.find({
    elderlyUserId,
    recordedAt: { $gte: sevenDaysAgo },
  }).sort({ recordedAt: -1 });

  return {
    todayCheckIn,
    hasCheckedInToday: Boolean(todayCheckIn),
    recentDaysCount: recentCheckIns.length,
    disclaimer: MEDICAL_DISCLAIMER,
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
