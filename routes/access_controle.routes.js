import { Router } from "express";
import {
    createPermission,
    getPermissionById,
    getSidebarMenuByRole,
    getAllMenuPermissions
} from '../controller/access_control.controller.js'

const router = Router();

router.route("/add-permission").post(createPermission);
router.route("/list-permission").get(getPermissionById);
router.route("/list").get(getSidebarMenuByRole)
router.route("/all-menu-permissions").get(getAllMenuPermissions);


export default router;
