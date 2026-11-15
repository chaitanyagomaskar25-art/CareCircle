import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as appointmentController from '../controllers/appointment.controller.js';

const appointmentRouter = Router();

// Protect all appointment routes with authentication
appointmentRouter.use(authenticate);

// List appointments with status & date filters
appointmentRouter.get('/', appointmentController.getAll);

// Create new appointment (with conflict check & permission verification)
appointmentRouter.post('/', appointmentController.create);

// Trigger reminder engine check
appointmentRouter.post('/trigger-reminders', appointmentController.triggerReminders);

// Get single appointment details
appointmentRouter.get('/:id', appointmentController.getById);

// Update appointment
appointmentRouter.put('/:id', appointmentController.update);

// Cancel appointment
appointmentRouter.delete('/:id', appointmentController.cancel);
appointmentRouter.patch('/:id/cancel', appointmentController.cancel);

// Get comprehensive preparation summary (medications, vitals, questions)
appointmentRouter.get('/:id/preparation-summary', appointmentController.getPrepSummary);

// Add family-provided question for doctor
appointmentRouter.post('/:id/questions', appointmentController.addQuestion);

export default appointmentRouter;
