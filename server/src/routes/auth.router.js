import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';
import { rateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from '../validators/auth.validator.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

// Public Authentication Endpoints (Rate-limited to prevent brute-force)
router.post(
  '/register',
  rateLimiter(15, 15 * 60 * 1000),
  validateRegister,
  authController.register
);

router.post(
  '/login',
  rateLimiter(15, 15 * 60 * 1000),
  validateLogin,
  authController.login
);

router.post(
  '/forgot-password',
  rateLimiter(10, 15 * 60 * 1000),
  validateForgotPassword,
  authController.forgotPassword
);

router.post(
  '/reset-password/:token',
  rateLimiter(10, 15 * 60 * 1000),
  validateResetPassword,
  authController.resetPassword
);

// Protected Authentication Endpoints
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);

// Role-Based Authorization Verification Endpoints
router.get('/test-admin', authenticate, authorizeRoles('admin'), (req, res) => {
  ApiResponse.ok(res, { role: req.user.role }, 'Access granted to admin resource.');
});

router.get(
  '/test-caregiver',
  authenticate,
  authorizeRoles('caregiver', 'admin'),
  (req, res) => {
    ApiResponse.ok(
      res,
      { role: req.user.role },
      'Access granted to caregiver/clinical resource.'
    );
  }
);

router.get(
  '/test-elderly',
  authenticate,
  authorizeRoles('elderly', 'admin'),
  (req, res) => {
    ApiResponse.ok(
      res,
      { role: req.user.role },
      'Access granted to elderly resident resource.'
    );
  }
);

router.get(
  '/test-family',
  authenticate,
  authorizeRoles('family', 'admin'),
  (req, res) => {
    ApiResponse.ok(
      res,
      { role: req.user.role },
      'Access granted to family caregiver resource.'
    );
  }
);

export default router;
