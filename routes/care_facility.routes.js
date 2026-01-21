import { Router } from "express";
import { getAllCareFacility, createCareFacility, updateFacilityName, deleteCareFacility } from "../controller/care_facility.controller.js";
import authenticateUser from "../middleware/auth.middleware.js";

const router = Router();

router.route('/care-facility').get(getAllCareFacility); 

router.use(authenticateUser);

router.route('/add-needs').post(createCareFacility);
router.route('/update-facility').patch(updateFacilityName);
router.route('/delete-facility').delete(deleteCareFacility);

export default router;