import { InterviewQuestion } from "../model/interview_questions.model.js";
import { Interview } from "../model/interview.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import logger from "../logger/logger.js";

// ==================== CREATE INTERVIEW QUESTION ====================
const createInterviewQuestion = async (req, res) => {
    try {
        const { interview_id } = req.query;
        const { interview_question } = req.body;

        logger.info(`Creating interview question - Interview ID: ${interview_id}`);

        // Validation
        if (!interview_id || !interview_question) {
            logger.warn("Create question - Missing required fields");
            return res.status(400).json(new ApiResponse(400, {}, "interview_id and interview_question are required"));
        }

        // Check if interview exists
        const interviewExists = await Interview.findOne({
            where: { interview_id, is_deleted: "N" }
        });

        if (!interviewExists) {
            logger.warn(`Create question - Interview not found - ID: ${interview_id}`);
            return res.status(404).json(new ApiResponse(404, {}, "Interview not found"));
        }

        // Auto-generate next interview_question_id (always increment, even if some are deleted)
        const lastQuestion = await InterviewQuestion.findOne({
            where: { interview_id },
            order: [["interview_question_id", "DESC"]]
        });

        const nextQuestionId = lastQuestion
            ? Number(lastQuestion.interview_question_id) + 1
            : 1;

        const newQuestion = await InterviewQuestion.create({
            interview_id,
            interview_question_id: nextQuestionId,
            interview_question: interview_question.trim(),
            status: "1",
            created_by: req.user?.id || null,
            created_on: new Date()
        });

        logger.info(`Interview question created successfully - ID: ${newQuestion.id}, Question No: ${nextQuestionId}`);
        return res.status(201).json(new ApiResponse(201, newQuestion, "Interview question created successfully"));

    } catch (error) {
        logger.error(`Error creating interview question: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

// ==================== GET ALL INTERVIEW QUESTIONS ====================
const getAllInterviewQuestions = async (req, res) => {
    try {
        logger.info("Fetching all interview questions");

        const whereCondition = { is_deleted: "N" };

        const questions = await InterviewQuestion.findAll({
            where: whereCondition,
            order: [["id", "ASC"]]
        });

        logger.info(`Retrieved ${questions.length} interview questions`);

        return res.status(200).json(new ApiResponse(200, {
            questions
        }, "Interview questions fetched successfully"));

    } catch (error) {
        logger.error(`Error fetching interview questions: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

// ==================== GET INTERVIEW QUESTIONS BY INTERVIEW ID ====================
const getQuestionsByInterviewId = async (req, res) => {
    try {
        const { interview_id } = req.query;

        logger.info(`Fetching questions for interview ID: ${interview_id}`);

        if (!interview_id) {
            logger.warn("Get questions - Missing interview_id");
            return res.status(400).json(new ApiResponse(400, {}, "interview_id is required"));
        }

        // Check if interview exists
        const interviewExists = await Interview.findOne({
            where: { interview_id, is_deleted: "N" }
        });

        if (!interviewExists) {
            logger.warn(`Get questions - Interview not found - ID: ${interview_id}`);
            return res.status(404).json(new ApiResponse(404, {}, "Interview not found"));
        }

        const questions = await InterviewQuestion.findAll({
            where: { interview_id, is_deleted: "N" },
            order: [["id", "ASC"]]
        });

        logger.info(`Retrieved ${questions.length} questions for interview ID: ${interview_id}`);

        return res.status(200).json(new ApiResponse(200, {
            questions
        }, "Questions fetched successfully"));

    } catch (error) {
        logger.error(`Error fetching questions: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

// ==================== GET INTERVIEW QUESTION BY ID ====================
const getInterviewQuestionById = async (req, res) => {
    try {
        const { interview_id, interview_question_id } = req.query;

        logger.info(`Fetching question - Interview ID: ${interview_id}, Question ID: ${interview_question_id}`);

        if (!interview_id || !interview_question_id) {
            logger.warn("Get question - Missing interview_id or interview_question_id");
            return res.status(400).json(new ApiResponse(400, {}, "interview_id and interview_question_id are required"));
        }

        const question = await InterviewQuestion.findOne({
            where: { interview_id, interview_question_id, is_deleted: "N" }
        });

        if (!question) {
            logger.warn(`Get question - Question not found - Interview: ${interview_id}, Question: ${interview_question_id}`);
            return res.status(404).json(new ApiResponse(404, {}, "Interview question not found"));
        }

        logger.info(`Interview question fetched successfully - Interview: ${interview_id}, Question: ${interview_question_id}`);
        return res.status(200).json(new ApiResponse(200, question, "Interview question fetched successfully"));

    } catch (error) {
        logger.error(`Error fetching interview question: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

// ==================== UPDATE INTERVIEW QUESTION ====================
const updateInterviewQuestion = async (req, res) => {
    try {
        const { interview_id, interview_question_id } = req.query;
        const { interview_question, status } = req.body;

        logger.info(`Updating question - Interview ID: ${interview_id}, Question ID: ${interview_question_id}`);

        if (!interview_id || !interview_question_id) {
            logger.warn("Update question - Missing interview_id or interview_question_id");
            return res.status(400).json(new ApiResponse(400, {}, "interview_id and interview_question_id are required"));
        }

        const question = await InterviewQuestion.findOne({
            where: { interview_id, interview_question_id, is_deleted: "N" }
        });

        if (!question) {
            logger.warn(`Update question - Question not found - Interview: ${interview_id}, Question: ${interview_question_id}`);
            return res.status(404).json(new ApiResponse(404, {}, "Interview question not found"));
        }

        if (interview_question !== undefined) {
            const trimmedQuestion = String(interview_question).trim();
            if (!trimmedQuestion) {
                logger.warn("Update question - interview_question is empty");
                return res.status(400).json(new ApiResponse(400, {}, "interview_question cannot be empty"));
            }
            question.interview_question = trimmedQuestion;
        }

        if (status !== undefined) {
            if (!["0", "1"].includes(status)) {
                logger.warn(`Update question - Invalid status: ${status}`);
                return res.status(400).json(new ApiResponse(400, {}, "Status must be '0' or '1'"));
            }
            question.status = status;
        }

        question.updated_by = req.user?.id || null;
        question.updated_on = new Date();

        await question.save();

        logger.info(`Interview question updated successfully - Interview: ${interview_id}, Question: ${interview_question_id}`);
        return res.status(200).json(new ApiResponse(200, question, "Interview question updated successfully"));

    } catch (error) {
        logger.error(`Error updating interview question: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

// ==================== DELETE INTERVIEW QUESTION (SOFT DELETE) ====================
const deleteInterviewQuestion = async (req, res) => {
    try {
        const { interview_id, interview_question_id, delete_all } = req.query;

        logger.info(`Deleting question - Interview ID: ${interview_id}, Question ID: ${interview_question_id}, Delete All: ${delete_all}`);

        // Validate interview_id is always required
        if (!interview_id) {
            logger.warn("Delete question - Missing interview_id");
            return res.status(400).json(new ApiResponse(400, {}, "interview_id is required"));
        }

        // Check if user wants to delete all questions for this interview
        if (delete_all === "true" || delete_all === true) {
            logger.info(`Deleting all questions for interview_id: ${interview_id}`);

            // Find all non-deleted questions for this interview
            const questions = await InterviewQuestion.findAll({
                where: { interview_id, is_deleted: "N" }
            });

            if (!questions || questions.length === 0) {
                logger.warn(`No questions found for interview_id: ${interview_id}`);
                return res.status(404).json(new ApiResponse(404, {}, "No questions found for this interview"));
            }

            // Soft delete all questions
            const updatePromises = questions.map(question => {
                question.is_deleted = "Y";
                question.deleted_by = req.user?.id || null;
                question.deleted_on = new Date();
                return question.save();
            });

            await Promise.all(updatePromises);

            logger.info(`All questions deleted for interview_id: ${interview_id} (Total: ${questions.length})`);
            return res.status(200).json(
                new ApiResponse(200, { deleted_count: questions.length }, `${questions.length} interview questions deleted successfully`)
            );
        }

        // Single question deletion - require interview_question_id
        if (!interview_question_id) {
            logger.warn("Delete question - Missing interview_question_id for single deletion");
            return res.status(400).json(new ApiResponse(400, {}, "interview_question_id is required for single question deletion"));
        }

        const question = await InterviewQuestion.findOne({
            where: { interview_id, interview_question_id, is_deleted: "N" }
        });

        if (!question) {
            logger.warn(`Delete question - Question not found - Interview: ${interview_id}, Question: ${interview_question_id}`);
            return res.status(404).json(new ApiResponse(404, {}, "Interview question not found"));
        }

        question.is_deleted = "Y";
        question.deleted_by = req.user?.id || null;
        question.deleted_on = new Date();

        await question.save();

        logger.info(`Interview question deleted successfully - Interview: ${interview_id}, Question: ${interview_question_id}`);
        return res.status(200).json(new ApiResponse(200, {}, "Interview question deleted successfully"));

    } catch (error) {
        logger.error(`Error deleting interview question: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

export {
    createInterviewQuestion,
    getAllInterviewQuestions,
    getQuestionsByInterviewId,
    getInterviewQuestionById,
    updateInterviewQuestion,
    deleteInterviewQuestion
};
