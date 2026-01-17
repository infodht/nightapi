import { Router } from "express";
import { getAllCareFacility, createCareFacility, updateFacilityName, deleteCareFacility } from "../controller/care_facility.controller.js";

const router = Router();

router.route('/care-facility').get(getAllCareFacility); 
router.route('/add-needs').post(createCareFacility);
router.route('/update-facility').patch(updateFacilityName);
router.route('/delete-facility').delete(deleteCareFacility);

export default router;