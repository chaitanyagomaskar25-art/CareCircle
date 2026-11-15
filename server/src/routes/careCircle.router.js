import { Router } from 'express';
import * as careCircleController from '../controllers/careCircle.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  validateInvite,
  validateUpdatePermissions,
  validateAcceptReject,
} from '../validators/careCircle.validator.js';

const router = Router();

// All Care Circle routes require authentication
router.use(authenticate);

// 1. Invitations
router.post('/invite', validateInvite, careCircleController.invite);
router.post('/accept', validateAcceptReject, careCircleController.accept);
router.post('/reject', validateAcceptReject, careCircleController.reject);

// 2. Member Management & Permissions
router.delete('/member/:relationshipId', careCircleController.remove);
router.patch(
  '/member/:relationshipId/permissions',
  validateUpdatePermissions,
  careCircleController.updatePermissions
);

// 3. Circle Views & Retrieval
router.get('/elderly/:elderlyId/members', careCircleController.getMembers);
router.get('/elderly/:elderlyId/pending', careCircleController.getPending);
router.get('/my-circles', careCircleController.getMyCircles);

// 4. Sensitive Resident Overview (Enforces cross-account data isolation)
router.get('/elderly/:elderlyId/summary', careCircleController.getResidentSummary);

// 5. Audit Logging
router.get('/elderly/:elderlyId/audit-logs', careCircleController.getAuditLogs);

export default router;
