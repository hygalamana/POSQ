import { Router } from 'express';
import { ShiftsController } from './shifts.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/current', ShiftsController.getCurrent);
router.get('/active', ShiftsController.getActive);
router.post('/open', ShiftsController.open);
router.post('/close', ShiftsController.close);
router.get('/', ShiftsController.getAll);

export default router;
