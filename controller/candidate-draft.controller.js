import { CandidateRegisterDraft } from "../model/candidate_register_draft.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendDraftReminders } from "../controller/mail.controller.js";

// Save a new draft
const saveDraft = async (req, res) => {
    try {
        const { candidate_name, email_id, mobile_number, countryCode } = req.body;

        const existingDraft = await CandidateRegisterDraft.findOne({ where: { email_id } });
        if (existingDraft) {
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

        return res.status(201).json(new ApiResponse(201, draft, "Draft saved successfully."));
    } catch (error) {
        console.error("Error saving draft:", error);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

// Get draft by email
const getDraftByEmailId = async (req, res) => {
    try {
        const { email_id } = req.query;

        const draft = await CandidateRegisterDraft.findOne({ where: { email_id } });
        if (!draft) {
            return res.status(404).json(new ApiResponse(404, {}, "Draft not found."));
        }

        return res.status(200).json(new ApiResponse(200, draft, "Draft fetched successfully."));
    } catch (error) {
        console.error("Error fetching draft:", error);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

// Get all drafts
const getAllDrafts = async (req, res) => {
    try {
        const drafts = await CandidateRegisterDraft.findAll();
        return res.status(200).json(new ApiResponse(200, drafts, "All drafts fetched successfully."));
    } catch (error) {
        console.error("Error fetching drafts:", error);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack));
    }
};

// Get all pending drafts (is_completed = '0')
const getPendingDrafts = async (req, res) => {
    try {
        const drafts = await CandidateRegisterDraft.findAll({
            where: {
                is_completed: '0' // ENUM value
            }
        });
        return res.status(200).json(
            new ApiResponse(200, drafts, "Pending (not completed) drafts fetched successfully.")
        );
    } catch (error) {
        console.error("Error fetching pending drafts:", error);
        return res.status(500).json(
            new ApiError(500, error.message, error, error.stack)
        );
    }
};

// Manual API trigger for draft reminders
const sendDraftReminderAPI = async (req, res) => {
  try {
    console.log("Manual API trigger for draft reminders");

    await sendDraftReminders();

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Draft reminder process triggered successfully"
      )
    );
  } catch (error) {
    console.error("Error triggering draft reminders manually:", error);
    return res.status(500).json(new ApiError(500,"Failed to trigger draft reminder process",error));
  }
};

// Update draft by email
const updateDraft = async (req, res) => {
    try {
        const { email_id } = req.query;
        const { candidate_name, mobile_number, countryCode, is_completed } = req.body;

        const draft = await CandidateRegisterDraft.findOne({ where: { email_id } });
        if (!draft) {
            return res.status(404).json(new ApiResponse(404, {}, "Draft not found."));
        }
        
        draft.candidate_name = candidate_name ?? draft.candidate_name;
        draft.mobile_number = mobile_number ?? draft.mobile_number;
        draft.countryCode = countryCode ?? draft.countryCode;
        // draft.data = data ?? draft.data;
        draft.is_completed = is_completed ?? draft.is_completed;
        draft.updated_on = new Date();

        await draft.save();

        return res.status(200).json(new ApiResponse(200, draft, "Candidate draft updated and registered successfully."));
    } catch (error) {
        console.error("Error updating draft:", error);
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
