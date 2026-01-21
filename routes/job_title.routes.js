import { Router } from "express";
import { getJobTitle, createJobTitle, updateJobTitle, deleteJobTitle } from "../controller/job_title.controller.js";
import authenticateUser from "../middleware/auth.middleware.js";

const router = Router();

router.route('/job-title').get(getJobTitle);

router.use(authenticateUser);

router.route('/add-title').post(createJobTitle);
router.route('/update-title').patch(updateJobTitle);
router.route('/delete-title').delete(deleteJobTitle);

export default router;