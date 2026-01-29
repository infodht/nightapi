import { Interview } from "../model/interview.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Op } from "sequelize";
import logger from "../logger/logger.js";

// ==================== CREATE INTERVIEW ====================
const createInterview = async (req, res) => {
    try {
        const { interview_name } = req.body;

        logger.info(`Creating interview: ${interview_name}`);

        // Validation
        if (!interview_name || interview_name.trim() === "") {
            logger.warn("Create interview - Missing interview_name");
            return res.status(400).json(new ApiResponse(400, {}, "interview_name is required"));
        }

        // Check duplicate
        const existingInterview = await Interview.findOne({
            where: { interview_name: interview_name.trim(), is_deleted: "N" }
        });

        if (existingInterview) {
            logger.warn(`Create interview - Duplicate name: ${interview_name}`);
            return res.status(409).json(new ApiResponse(409, {}, "Interview with this name already exists"));
        }

        const newInterview = await Interview.create({
            interview_name: interview_name.trim(),
            status: "1",
            created_by: req.user?.id || null,
            created_on: new Date()
        });

        logger.info(`Interview created successfully - ID: ${newInterview.interview_id}, Name: ${interview_name}`);
        return res.status(201).json(new ApiResponse(201, newInterview, "Interview created successfully"));

    } catch (error) {
        logger.error(`Error creating interview: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

// ==================== GET ALL INTERVIEWS ====================
const getAllInterviews = async (req, res) => {
    try {
        logger.info("Fetching all interviews");

        const whereCondition = { is_deleted: "N" };

        const interviews = await Interview.findAll({
            where: whereCondition,
            order: [["interview_id", "DESC"]]
        });

        logger.info(`Retrieved ${interviews.length} interviews`);

        return res.status(200).json(new ApiResponse(200, {
            interviews
        }, "Interviews fetched successfully"));

    } catch (error) {
        logger.error(`Error fetching interviews: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

// ==================== GET INTERVIEW BY ID ====================
const getInterviewById = async (req, res) => {
    try {
        const { interview_id } = req.params;

        logger.info(`Fetching interview ID: ${interview_id}`);

        if (!interview_id) {
            logger.warn("Get interview - Missing interview_id");
            return res.status(400).json(new ApiResponse(400, {}, "interview_id is required"));
        }

        const interview = await Interview.findOne({
            where: { interview_id, is_deleted: "N" }
        });

        if (!interview) {
            logger.warn(`Get interview - Interview not found - ID: ${interview_id}`);
            return res.status(404).json(new ApiResponse(404, {}, "Interview not found"));
        }
        logger.info(`Interview fetched successfully - ID: ${interview_id}`);
        return res.status(200).json(new ApiResponse(200, interview, "Interview fetched successfully"));
    } catch (error) {
        logger.error(`Error fetching interview: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

// ==================== UPDATE INTERVIEW ====================
const updateInterview = async (req, res) => {
    try {
        const { interview_id } = req.query;
        const { interview_name, status } = req.body;

        logger.info(`Updating interview ID: ${interview_id}`);

        if (!interview_id) {
            logger.warn("Update interview - Missing interview_id");
            return res.status(400).json(new ApiResponse(400, {}, "interview_id is required"));
        }

        const interview = await Interview.findOne({
            where: { interview_id, is_deleted: "N" }
        });

        if (!interview) {
            logger.warn(`Update interview - Interview not found - ID: ${interview_id}`);
            return res.status(404).json(new ApiResponse(404, {}, "Interview not found"));
        }

        // Check duplicate name if being updated
        if (interview_name && interview_name.trim() !== interview.interview_name) {
            const duplicate = await Interview.findOne({
                where: {
                    interview_name: interview_name.trim(),
                    interview_id: { [Op.ne]: interview_id },
                    is_deleted: "N"
                }
            });

            if (duplicate) {
                logger.warn(`Update interview - Duplicate name: ${interview_name}`);
                return res.status(409).json(new ApiResponse(409, {}, "Interview with this name already exists"));
            }

            interview.interview_name = interview_name.trim();
        }

        if (status !== undefined) {
            if (!["0", "1"].includes(status)) {
                logger.warn(`Update interview - Invalid status: ${status}`);
                return res.status(400).json(new ApiResponse(400, {}, "Status must be '0' or '1'"));
            }
            interview.status = status;
        }

        interview.updated_by = req.user?.id || null;
        interview.updated_on = new Date();

        await interview.save();

        logger.info(`Interview updated successfully - ID: ${interview_id}`);
        return res.status(200).json(new ApiResponse(200, interview, "Interview updated successfully"));

    } catch (error) {
        logger.error(`Error updating interview: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

// ==================== DELETE INTERVIEW (SOFT DELETE) ====================
const deleteInterview = async (req, res) => {
    try {
        const { interview_id } = req.query;

        logger.info(`Deleting interview ID: ${interview_id}`);

        if (!interview_id) {
            logger.warn("Delete interview - Missing interview_id");
            return res.status(400).json(new ApiResponse(400, {}, "interview_id is required"));
        }

        const interview = await Interview.findOne({
            where: { interview_id, is_deleted: "N" }
        });

        if (!interview) {
            logger.warn(`Delete interview - Interview not found - ID: ${interview_id}`);
            return res.status(404).json(new ApiResponse(404, {}, "Interview not found"));
        }

        interview.is_deleted = "Y";
        interview.deleted_by = req.user?.id || null;
        interview.deleted_on = new Date();

        await interview.save();

        logger.info(`Interview deleted successfully - ID: ${interview_id}`);
        return res.status(200).json(new ApiResponse(200, {}, "Interview deleted successfully"));

    } catch (error) {
        logger.error(`Error deleting interview: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

export {
    createInterview,
    getAllInterviews,
    getInterviewById,
    updateInterview,
    deleteInterview
};
