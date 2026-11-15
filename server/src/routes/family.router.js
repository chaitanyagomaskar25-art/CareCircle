import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';
import {
  getFamilyDashboard,
  getActivityFeed,
  getResidentDetail,
} from '../controllers/family.controller.js';

const familyRouter = Router();

// Protect all family routes
familyRouter.use(authenticate);
familyRouter.use(authorizeRoles('family', 'caregiver', 'admin'));

// GET /api/v1/family/dashboard - Comprehensive overview of authorized seniors & alerts
familyRouter.get('/dashboard', getFamilyDashboard);

// GET /api/v1/family/activity-feed - Filtered family activity feed
familyRouter.get('/activity-feed', getActivityFeed);

// GET /api/v1/family/resident/:elderlyId - Specific resident detail for family view
familyRouter.get('/resident/:elderlyId', getResidentDetail);

export default familyRouter;
