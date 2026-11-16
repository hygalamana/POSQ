import { Router } from 'express';
import { UsersController } from './users.controller';
import { validate } from '../../middleware/validate';
import { createUserSchema, updateUserSchema } from './users.schema';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', UsersController.getUsers);
router.post('/', validate(createUserSchema), UsersController.createUser);
router.put('/:id', validate(updateUserSchema), UsersController.updateUser);
router.delete('/:id', UsersController.deleteUser);

export default router;
