import { Router } from 'express';
import { CategoriesController } from './categories.controller';
import { validate } from '../../middleware/validate';
import { createCategorySchema, updateCategorySchema } from './categories.schema';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../utils/enums';

const router = Router();

router.use(authenticate);

router.get('/', CategoriesController.getAll);
router.get('/:id', CategoriesController.getById);

router.post(
  '/',
  requireRole([Role.OWNER, Role.MANAGER]),
  validate(createCategorySchema),
  CategoriesController.create
);

router.put(
  '/:id',
  requireRole([Role.OWNER, Role.MANAGER]),
  validate(updateCategorySchema),
  CategoriesController.update
);

router.delete(
  '/:id',
  requireRole([Role.OWNER]),
  CategoriesController.delete
);

export default router;
