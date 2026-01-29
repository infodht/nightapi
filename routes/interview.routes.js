import { Router } from "express";
import {
  createInterview,
  getAllInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview
} from "../controller/interview.controller.js";
import authenticateUser from "../middleware/auth.middleware.js";

const router = Router();

// ==================== PUBLIC ROUTES ====================
router.get("/all", getAllInterviews);
router.get("/:interview_id", getInterviewById);

// ==================== PROTECTED ROUTES (ADMIN ONLY) ====================
router.post("/create", authenticateUser, createInterview);
router.patch("/update", authenticateUser, updateInterview);
router.delete("/delete", authenticateUser, deleteInterview);

export default router;
