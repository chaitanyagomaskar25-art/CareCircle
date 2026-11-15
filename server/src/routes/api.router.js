import { Router } from 'express';
import healthRouter from './health.router.js';
import authRouter from './auth.router.js';
import careCircleRouter from './careCircle.router.js';
import medicationRouter from './medication.router.js';
import notificationRouter from './notification.router.js';
import caregiverRouter from './caregiver.router.js';
import familyRouter from './family.router.js';
import appointmentRouter from './appointment.router.js';
import healthProfileRouter from './healthProfile.router.js';

const apiRouter = Router();

// Health Check Endpoint: GET /api/v1/health
apiRouter.use('/health', healthRouter);

// Authentication & Authorization Module: /api/v1/auth
apiRouter.use('/auth', authRouter);

// Care Circle Module: /api/v1/care-circle
apiRouter.use('/care-circle', careCircleRouter);

// Medication Management Module: /api/v1/medications
apiRouter.use('/medications', medicationRouter);

// Notification & Reminder Engine Module: /api/v1/notifications
apiRouter.use('/notifications', notificationRouter);

// Caregiver Dashboard & Individual Resident Care Overview: /api/v1/caregiver
apiRouter.use('/caregiver', caregiverRouter);

// Family Member Dashboard & Activity Feed: /api/v1/family
apiRouter.use('/family', familyRouter);

// Doctor Appointment Management Module: /api/v1/appointments
apiRouter.use('/appointments', appointmentRouter);

// Health Profile & Wellness Tracking Module: /api/v1/health-profile
apiRouter.use('/health-profile', healthProfileRouter);

// Base route for API metadata
apiRouter.get('/', (req, res) => {
  res.status(200).json({
    name: 'CareCircle API',
    description: 'Elderly Care & Medication Management Platform',
    version: 'v1',
    status: 'active',
    modules: [
      'health',
      'auth',
      'care-circle',
      'medications',
      'notifications',
      'caregiver',
      'family',
      'appointments',
      'health-profile',
    ],
  });
});

export default apiRouter;
