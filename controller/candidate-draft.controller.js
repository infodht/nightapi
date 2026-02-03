import { CandidateRegisterDraft } from "../model/candidate_register_draft.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendDraftReminders } from "../controller/mail.controller.js";
import logger from "../logger/logger.js";
import * as cache from "../services/cache/cache.service.js";

// Save a new draft
const saveDraft = async (req, res) => {
    try {
        const { candidate_name, email_id, mobile_number, countryCode } = req.body;
        logger.info(`Saving draft for candidate: ${candidate_name}, email: ${email_id}`);

        const existingDraft = await CandidateRegisterDraft.findOne({ where: { email_id } });
        if (existingDraft) {
            logger.warn(`Draft already exists for email: ${email_id}`);
            return res.status(400).json(new ApiResponse(400, {}, "Draft with this email already exists."));
        }

        const draft = await CandidateRegisterDraft.create({
            candidate_name,
            email_id,
            mobile_number,
            countryCode,
            is_completed: "0",
            created_on: new Date()
        });

        await cache.delPattern("drafts:*");

        logger.info(`Draft saved successfully for email: ${email_id}`);
        return res.status(201).json(new ApiResponse(201, draft, "Draft saved successfully."));
    } catch (error) {
        logger.error(`Error saving draft: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

// Get draft by email
const getDraftByEmailId = async (req, res) => {
    try {
        const { email_id } = req.query;
        logger.info(`Fetching draft for email: ${email_id}`);

        const cacheKey = `drafts:email:${email_id}`;
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
            logger.info(`Returning cached draft for email: ${email_id}`);
            return res.status(200).json(cachedData);
        }

        const draft = await CandidateRegisterDraft.findOne({ where: { email_id } });
        if (!draft) {
            logger.warn(`Draft not found for email: ${email_id}`);
            return res.status(404).json(new ApiResponse(404, {}, "Draft not found."));
        }

        logger.info(`Draft fetched successfully for email: ${email_id}`);
        const response = new ApiResponse(200, draft, "Draft fetched successfully.");
        await cache.set(cacheKey, response, 300);
        return res.status(200).json(response);
    } catch (error) {
        logger.error(`Error fetching draft for email ${email_id}: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

// Get all drafts
const getAllDrafts = async (req, res) => {
    try {
        logger.info('Fetching all candidate drafts');
        const cacheKey = "drafts:all";
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
            logger.info("Returning cached all drafts");
            return res.status(200).json(cachedData);
        }
        const drafts = await CandidateRegisterDraft.findAll();
        logger.info(`Retrieved ${drafts.length} drafts`);
        const response = new ApiResponse(200, drafts, "All drafts fetched successfully.");
        await cache.set(cacheKey, response, 300);
        return res.status(200).json(response);
    } catch (error) {
        logger.error(`Error fetching all drafts: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

// Get all pending drafts (is_completed = '0')
const getPendingDrafts = async (req, res) => {
    try {
        logger.info('Fetching all pending drafts');
        const cacheKey = "drafts:pending";
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
            logger.info("Returning cached pending drafts");
            return res.status(200).json(cachedData);
        }
        const drafts = await CandidateRegisterDraft.findAll({
            where: {
                is_completed: '0' // ENUM value
            }
        });
        logger.info(`Retrieved ${drafts.length} pending drafts`);
        const response = new ApiResponse(200, drafts, "Pending (not completed) drafts fetched successfully.");
        await cache.set(cacheKey, response, 300);
        return res.status(200).json(response);
    } catch (error) {
        logger.error(`Error fetching pending drafts: ${error.message}`);
        return res.status(500).json(
            new ApiError(500, error.message, error, error.stack)
        );
    }
};

// Manual API trigger for draft reminders
const sendDraftReminderAPI = async (req, res) => {
  try {
    logger.info("Manual API trigger for draft reminders initiated");

    await sendDraftReminders();

    logger.info("Draft reminder process triggered successfully");
    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Draft reminder process triggered successfully"
      )
    );
  } catch (error) {
    logger.error(`Error triggering draft reminders manually: ${error.message}`);
    return res.status(500).json(new ApiError(500,"Failed to trigger draft reminder process",error));
  }
};

// Update draft by email
const updateDraft = async (req, res) => {
    try {
        const { email_id } = req.query;
        const { candidate_name, mobile_number, countryCode, is_completed } = req.body;
        logger.info(`Updating draft for email: ${email_id}`);

        const draft = await CandidateRegisterDraft.findOne({ where: { email_id } });
        if (!draft) {
            logger.warn(`Draft not found for update - email: ${email_id}`);
            return res.status(404).json(new ApiResponse(404, {}, "Draft not found."));
        }
        
        draft.candidate_name = candidate_name ?? draft.candidate_name;
        draft.mobile_number = mobile_number ?? draft.mobile_number;
        draft.countryCode = countryCode ?? draft.countryCode;
        draft.is_completed = is_completed ?? draft.is_completed;
        draft.updated_on = new Date();

        await draft.save();

        await cache.delPattern("drafts:*");

        logger.info(`Draft updated successfully for email: ${email_id}`);
        return res.status(200).json(new ApiResponse(200, draft, "Candidate draft updated and registered successfully."));
    } catch (error) {
        logger.error(`Error updating draft for email ${email_id}: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

export {
    saveDraft,
    getDraftByEmailId,
    getAllDrafts,
    getPendingDrafts,
    sendDraftReminderAPI,
    updateDraft
}
