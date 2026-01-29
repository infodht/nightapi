import {
    candidateRegister,
    getAllInfoCandidate,
    getCandidateInfoById,
    formAction,
    // hireflixIntegration,
    // hireflixGetPositions,
    // hireflixInterviewData,
    // hireflixStatusChange,
    refnowGetRequests,
    refnowGetRequestById,
    refnowGetQuestionProfiles,
    refnowPostNewRequest,
    refnowGetCreditBalance,
    UpdateCandidateInfo,
    getFile,
    getCandidateInfoByEmId,
    saveCandidateInterview,
    getCandidateInterview
} from "../controller/candidate.controller.js";
import {
    saveDraft,
    getDraftByEmailId,
    getAllDrafts,
    getPendingDrafts,
    sendDraftReminderAPI,
    updateDraft
} from "../controller/candidate-draft.controller.js";

import {
    createMenu,
    getMenuList
} from "../controller/candidate_menu.controller.js"

import { upload, handleUpload } from "../middleware/multer.middleware.js";
import { Router } from "express";
import authenticateUser from "../middleware/auth.middleware.js";

const router = Router();

// public routes

router.post(
  "/candidate",
  upload.fields([
    { name: "upload_cv", maxCount: 1 },
    { name: "profile_img", maxCount: 1 }
  ]),
  handleUpload,
  candidateRegister
);
router.post("/draft/save", saveDraft);
router.patch(
  "/candidate/interview",
  upload.array("interview_video_answers", 10),
  handleUpload,
  saveCandidateInterview
);
router.route("/candidate/interview").get(getCandidateInterview);

// auth middleware (everything below is protected)

router.use(authenticateUser);

// protected routes

router.put(
    "/candidate/update",
    upload.fields([
        { name: "upload_cv", maxCount: 1 },
        { name: "profile_img", maxCount: 1 }
    ]),
    handleUpload,
    UpdateCandidateInfo
);
router.route('/info').get(getAllInfoCandidate);
router.route('/action').patch(formAction);
router.route('/data').get(getCandidateInfoById);

// router.route('/hireflix/invite').post(hireflixIntegration);
// router.route('/hireflix/positions').get(hireflixGetPositions);
// router.route('/hireflix/interview/:interviewId').get(hireflixInterviewData);
// router.route('/hireflix/status').patch(hireflixStatusChange);

router.route('/refnow/requests').get(refnowGetRequests);
router.route('/refnow/request').get(refnowGetRequestById);
router.route("/refnow/questionprofiles").get(refnowGetQuestionProfiles);
router.route('/refnow/request/create').post(refnowPostNewRequest);
router.route('/refnow/credit/balance').get(refnowGetCreditBalance);

router.get("/draft/get", getDraftByEmailId);
router.get("/draft/all", getAllDrafts);
router.get("/draft/pending", getPendingDrafts);
router.post("/draft/reminder/send", sendDraftReminderAPI);
router.patch("/draft/update", updateDraft);

router.route("/menu").post(createMenu);
router.route("/menu/list/candidate").get(getMenuList);

router.route("/file").get(getFile);
router.route('/data').get(getCandidateInfoByEmId);

export default router;