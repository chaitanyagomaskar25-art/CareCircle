import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as caregiverController from '../controllers/caregiver.controller.js';

const router = Router();

// All caregiver routes require authentication
router.use(authenticate);

// Aggregated overview across only explicitly authorized elderly residents
router.get('/overview', caregiverController.getDashboardOverview);

// Detailed individual care overview page data
router.get('/elderly/:elderlyId', caregiverController.getElderlyDetail);

// Sub-actions on an authorized senior
router.post('/elderly/:elderlyId/observations', caregiverController.addObservation);
router.post('/elderly/:elderlyId/notes', caregiverController.addNote);
router.post('/elderly/:elderlyId/appointments', caregiverController.addAppointment);

export default router;
