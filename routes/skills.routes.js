import { Router } from "express";
import { getAllSkills, createSkills, updateSkills, deleteSkills } from "../controller/skills.controller.js";
import authenticateUser from "../middleware/auth.middleware.js";

const router = Router();

router.route('/skill').get(getAllSkills);

router.use(authenticateUser);

router.route('/add-skill').post(createSkills);
router.route('/update-skill').patch(updateSkills);
router.route('/delete-skill').delete(deleteSkills); 

export default router;