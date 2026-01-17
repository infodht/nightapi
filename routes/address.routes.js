import { address, getAddress } from "../controller/address.controller.js";
import { Router } from "express";

const router = Router();

router.route('/:postcode').get(address);
router.route('/get/:id').get(getAddress);

export default router;