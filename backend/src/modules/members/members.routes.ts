import { Router } from "express";
import { MembersController } from "./members.controller";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createMemberSchema, updateMemberSchema } from "./members.schema";
import { requireRole } from "../../middleware/rbac";
import { Role } from "../../utils/enums";

const router = Router();

router.use(authenticate);

router.get("/", MembersController.getAll);
router.get("/:id", MembersController.getById);
router.post("/", validate(createMemberSchema), MembersController.create);
router.put("/:id", validate(updateMemberSchema), MembersController.update);
router.delete("/:id", requireRole([Role.OWNER, Role.MANAGER]), MembersController.delete);

export default router;
