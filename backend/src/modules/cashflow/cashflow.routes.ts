import { Router } from 'express';
import { CashflowController } from './cashflow.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../utils/enums';

const router = Router();

router.use(authenticate);

router.get('/', CashflowController.getAll);
router.post('/', CashflowController.create);
router.delete('/:id', requireRole([Role.OWNER, Role.MANAGER]), CashflowController.delete);

export default router;
