import { createRoles, updateRoles, getRole, deleteRole  } from "../controller/roles.controller.js";
import { Router } from "express";

const router = Router();

router.route('/').post(createRoles);
router.route('/update').patch(updateRoles)
router.route('/list-role').get(getRole)
router.route('/delete').delete(deleteRole)

export default router;