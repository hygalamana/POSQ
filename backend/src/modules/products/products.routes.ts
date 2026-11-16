import { Router } from 'express';
import { ProductsController } from './products.controller';
import { validate } from '../../middleware/validate';
import { createProductSchema, updateProductSchema } from './products.schema';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../utils/enums';
import { upload } from '../../config/cloudinary';

const router = Router();

router.use(authenticate);

router.get('/', ProductsController.getAll);
router.get('/:id', ProductsController.getById);

router.post(
  '/',
  requireRole([Role.OWNER, Role.MANAGER]),
  validate(createProductSchema),
  ProductsController.create
);

router.put(
  '/:id',
  requireRole([Role.OWNER, Role.MANAGER]),
  validate(updateProductSchema),
  ProductsController.update
);

router.delete(
  '/:id',
  requireRole([Role.OWNER]),
  ProductsController.delete
);

router.post(
  '/:id/image',
  requireRole([Role.OWNER, Role.MANAGER]),
  upload.single('image'),
  ProductsController.uploadImage
);

router.get('/:id/stock-movements', ProductsController.getStockMovements);
router.post(
  '/:id/stock-movements',
  requireRole([Role.OWNER, Role.MANAGER]),
  ProductsController.addStockMovement
);

export default router;
