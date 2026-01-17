import { Router } from "express";
import { getAllCountryCode } from '../controller/country_code.controller.js';

const router = Router();

router.route('/country-code').get(getAllCountryCode);

export default router;