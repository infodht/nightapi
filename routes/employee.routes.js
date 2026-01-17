import { Router } from "express";
import { createEmployee, updateEmployee, changeEmployeePassword } from "../controller/employee.controller.js";

const router = Router();

router.route('/create').post(createEmployee);
router.route('/update/:id').patch(updateEmployee);
router.route('/change-password').patch(changeEmployeePassword);

export default router;