import { Router } from 'express';
import { OutletsController } from './outlets.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', OutletsController.getOutlet);
router.patch('/points', OutletsController.updatePointsSettings);

export default router;
