import { login } from '../controller/auth.controller.js'
import { Router } from "express";

const router = Router();

router.route('/login').post(login);

export default router;