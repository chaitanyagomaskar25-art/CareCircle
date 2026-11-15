import { Router } from 'express';
import * as medicationController from '../controllers/medication.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  validateCreateMedication,
  validateUpdateMedication,
} from '../validators/medication.validator.js';

const router = Router();

// All medication routes require authentication
router.use(authenticate);

// 1. Daily Schedule & Dose Actions (Must precede /:id)
router.get('/schedule/:elderlyId/today', medicationController.getSchedule);
router.post('/doses/:doseId/take', medicationController.confirmDose);
router.post('/doses/:doseId/skip', medicationController.skipDose);
router.get('/history/:elderlyId', medicationController.getHistory);
router.get('/adherence/:elderlyId', medicationController.getAdherence);

// 2. Prescription CRUD
router.post('/', validateCreateMedication, medicationController.create);
router.get('/', medicationController.getAll);
router.get('/:id', medicationController.getById);
router.put('/:id', validateUpdateMedication, medicationController.update);
router.delete('/:id', medicationController.remove);

export default router;
