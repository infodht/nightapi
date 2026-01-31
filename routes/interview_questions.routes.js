import { Router } from "express";
import {
    createInterviewQuestion,
    getAllInterviewQuestions,
    getQuestionsByInterviewId,
    getInterviewQuestionById,
    updateInterviewQuestion,
    deleteInterviewQuestion
} from "../controller/interview_questions.controller.js";
import authenticateUser from "../middleware/auth.middleware.js";

const router = Router();

// ==================== PUBLIC ROUTES ====================
router.get("/all", getAllInterviewQuestions);
router.get("/interview", getQuestionsByInterviewId);
router.get("/single-question", getInterviewQuestionById);

// ==================== PROTECTED ROUTES (ADMIN ONLY) ====================
router.post("/create", authenticateUser, createInterviewQuestion);
router.patch("/update", authenticateUser, updateInterviewQuestion);
router.delete("/delete", authenticateUser, deleteInterviewQuestion);

export default router;
