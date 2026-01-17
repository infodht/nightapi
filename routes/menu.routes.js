import { Router } from "express";
import { getMenuList, createMenu, updateMenu } from "../controller/menu.controller.js";

const router = Router();

router.route('/menus').get(getMenuList);
router.route('/create-menu').post(createMenu)
router.route('/update-menu/:id').patch(updateMenu);

export default router;