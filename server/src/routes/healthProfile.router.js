import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as healthController from '../controllers/healthProfile.controller.js';

const router = Router();

// Protect all health profile routes with authentication
router.use(authenticate);

// Profile overview and updates
router.get('/:elderlyId', healthController.getHealthProfile);
router.put('/:elderlyId', healthController.updateHealthProfile);

// Medical Conditions
router.post('/:elderlyId/conditions', healthController.addMedicalCondition);
router.delete('/:elderlyId/conditions/:conditionId', healthController.removeMedicalCondition);

// Allergies
router.post('/:elderlyId/allergies', healthController.addAllergy);
router.delete('/:elderlyId/allergies/:allergyId', healthController.removeAllergy);

// Emergency Contacts
router.post('/:elderlyId/emergency-contacts', healthController.addEmergencyContact);

// Doctor Information
router.post('/:elderlyId/doctors', healthController.addDoctorInformation);

// Health Observations (Manual records & Historical queries)
router.get('/:elderlyId/observations', healthController.getHistoricalObservations);
router.post('/:elderlyId/observations', healthController.recordObservation);
router.get('/:elderlyId/trends', healthController.getHistoricalTrends);

// Daily Wellness Check-in
router.post('/:elderlyId/wellness-checkin', healthController.recordDailyWellnessCheckIn);
router.get('/:elderlyId/wellness-checkin/today', healthController.getTodayWellnessCheckIn);

export default router;
