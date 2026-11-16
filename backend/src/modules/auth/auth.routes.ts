import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { loginSchema, refreshSchema, updateProfileSchema, updateOutletSchema } from './auth.schema';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../utils/enums';

const router = Router();

router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshSchema), AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);
router.put('/me', authenticate, validate(updateProfileSchema), AuthController.updateProfile);
router.put(
  '/outlet',
  authenticate,
  requireRole([Role.OWNER]),
  validate(updateOutletSchema),
  AuthController.updateOutlet
);

export default router;
