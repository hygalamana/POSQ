import { Router } from 'express';
import { SalesController } from './sales.controller';
import { validate } from '../../middleware/validate';
import { createSaleSchema } from './sales.schema';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../utils/enums';

const router = Router();

router.use(authenticate);

router.get('/', SalesController.getAll);
router.get('/:id', SalesController.getById);

router.post(
  '/',
  validate(createSaleSchema),
  SalesController.create
);

router.post(
  '/sync-offline',
  SalesController.syncOffline
);

router.put(
  '/:id/cancel',
  requireRole([Role.OWNER, Role.MANAGER]),
  SalesController.cancel
);

router.delete(
  '/:id',
  requireRole([Role.OWNER]),
  SalesController.delete
);

export default router;
