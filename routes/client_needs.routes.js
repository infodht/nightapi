import { Router } from "express";
import { getAllNeeds, createClientNeeds, updateClientNeeds, deleteClientNeeds } from "../controller/client_needs.controller.js";

const router = Router();

router.route('/needs').get(getAllNeeds); 
router.route('/add-needs').post(createClientNeeds);
router.route('/update-needs').patch(updateClientNeeds);
router.route('/delete-needs').delete(deleteClientNeeds);


export default router;