import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../utils/enums';

const router = Router();

router.use(authenticate);

router.get(
  '/summary',
  requireRole([Role.OWNER, Role.MANAGER]),
  ReportsController.getSummary
);

export default router;
