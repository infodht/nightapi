import { Candidate } from "../model/candidate.model.js";
import { CandidateInterview } from "../model/candidate_interview.model.js";
import { InterviewQuestion } from "../model/interview_questions.model.js";
import { sequelize } from "../database/db.connection.js";
import crypto from "crypto";
import path from 'path';
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { client_needs } from "../model/client_needs.model.js";
import { skills } from "../model/skills.model.js";
import { careFacility } from "../model/care_facility.model.js";
import { job_title } from "../model/job_title.model.js";
import { Employee } from "../model/employee.model.js";
import { Op } from "sequelize";
import logger from '../logger/logger.js';
// import {
//   inviteCandidate,
//   getPositions,
//   getInterviewData,
//   updateInterviewFinalist,
//   updateInterviewDiscard
// } from "../services/hireflix.service.js";
import {
  listReferenceRequests,
  getReferenceRequestById,
  getQuestionProfiles,
  postNewReferenceRequest,
  getRefNowCreditBalance
} from "../services/refnow.service.js";
import { getPrefixFromRole, generateNextId } from "../controller/employee.controller.js";

const candidateRegister = async (req, res) => {
  try {
    const {
      candidateId,
      candidate_name,
      post_code,
      address_line_1,
      address_line_2,
      landline_no,
      jobTitle,
      place,
      mobile_number,
      email_id,
      candidate_dob,
      passport,
      is_visa_for_uk,
      experience,
      countryCode,
      skills,
      careFacility,
      clientNeeds,
      reason_for_leave,
      current_position,
      current_company_name,
      emergency_shift,
      current_salary,
      desired_salary,
      notice_period,
      media_name,
      other_passport,
      advert_ref,
      driver_car_owner,
      dbs,
      dbs_workforce_type,
      w_u_consider
    } = req.body;

    logger.info(`Candidate registration request - Email: ${email_id}, Name: ${candidate_name}`);

    // Validation
    if (!candidate_name || !post_code || !address_line_1 || !place || !email_id || !candidate_dob || !passport || !experience || !countryCode || !skills) {
      logger.warn(`Candidate registration - Missing required fields - Email: ${email_id}`);
      throw new ApiError(400, "All the fields are required");
    }

    // ---------------- Files from middleware ----------------
    // These values are:
    // local  → filename
    // cloud  → URL
    // remote → URL
    const cvFile = req.uploadedFiles?.upload_cv ?? null;
    const profileImg = req.uploadedFiles?.profile_img ?? null;

    // Storage type decided by middleware
    const storageType = req.storage_type ?? "local";

    // ---------------- Duplicate email check ----------------
    const existingEmail = await Candidate.findOne({
      where: { email_id },
    });

    if (existingEmail) {
      logger.warn(`Candidate registration - Email already exists: ${email_id}`);
      throw new ApiError(409, "Email already registered");
    }

    // Create new candidate
    if (!candidateId) {
      logger.info(`Creating new candidate record - Email: ${email_id}`);
      const newCandidate = await Candidate.create({
        candidateId,
        candidate_name,
        post_code,
        status: "1",
        address_line_1,
        address_line_2,
        landline_no,
        place,
        job_title: Array.isArray(jobTitle) ? jobTitle.join(",") : jobTitle,
        care_facility: Array.isArray(careFacility) ? careFacility.join(",") : careFacility,
        client_need: Array.isArray(clientNeeds) ? clientNeeds.join(",") : clientNeeds,
        mobile_number,
        email_id,
        candidate_dob,
        passport,
        other_passport,
        is_visa_for_uk,
        experience,
        countryCode,
        reason_for_leave,
        current_position,
        current_company_name,
        emergency_shift,
        current_salary,
        desired_salary,
        notice_period,
        driver_car_owner,
        w_u_consider,
        dbs,
        dbs_workforce_type,
        skills: Array.isArray(skills) ? skills.join(",") : skills,
        created_by: candidate_name,
        upload_cv: cvFile,
        profile_img: profileImg,
        storage_type: storageType,
        media_name,
        advert_ref,
        created_on: new Date(),
        updated_on: new Date(),
        updated_by: candidate_name,
        is_deleted: "N",
      });

      logger.info(`Candidate registered successfully - Email: ${email_id}, ID: ${newCandidate.candidateId}`);
      return res
        .status(201)
        .json(new ApiResponse(201, newCandidate, "Successfully Candidate Registered"));
    }
  } catch (error) {
    logger.error(`Candidate registration error for email ${email_id}: ${error.message}`);
    return res.status(400).json(new ApiResponse(400, error, `${error.message}`));
  }
};

const getAllInfoCandidate = async (req, res) => {
  try {
    // Get pagination info from query parameters
    // page=1, limit=10 (default)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const search = req.query.search ? req.query.search.trim() : null;

    logger.info(`Fetching all candidates - Page: ${page}, Limit: ${limit}, Search: ${search || 'none'}`);

    const whereCondition = {
      is_deleted: { [Op.ne]: "Y" },
      form_status: { [Op.ne]: "REJECTED" }
    };

    // console.log("whereCondition", whereCondition);

    const [jobTitles, skillsList, facilities, needs] = await Promise.all([
      job_title.findAll({ attributes: ["id", "name"] }),
      skills.findAll({ attributes: ["id", "name"] }),
      careFacility.findAll({ attributes: ["id", "facility_name"] }),
      client_needs.findAll({ attributes: ["id", "name"] }),
    ]);

    // Create forward + reverse mappings
    const jobTitleMap = Object.fromEntries(jobTitles.map(j => [j.id, j.name]));
    const skillMap = Object.fromEntries(skillsList.map(s => [s.id, s.name]));
    const facilityMap = Object.fromEntries(facilities.map(f => [f.id, f.facility_name]));
    const needMap = Object.fromEntries(needs.map(n => [n.id, n.name]));

    // Reverse maps for search
    const reverseJobMap = Object.fromEntries(jobTitles.map(j => [j.name.toLowerCase(), j.id]));
    const reverseSkillMap = Object.fromEntries(skillsList.map(s => [s.name.toLowerCase(), s.id]));
    const reverseFacilityMap = Object.fromEntries(facilities.map(f => [f.facility_name.toLowerCase(), f.id]));
    const reverseNeedMap = Object.fromEntries(needs.map(n => [n.name.toLowerCase(), n.id]));

    // Search logic
    if (search) {
      const lowerSearch = search.toLowerCase();

      const matchingJobIds = Object.entries(reverseJobMap)
        .filter(([name]) => name.includes(lowerSearch))
        .map(([_, id]) => id);

      const matchingSkillIds = Object.entries(reverseSkillMap)
        .filter(([name]) => name.includes(lowerSearch))
        .map(([_, id]) => id);

      const matchingFacilityIds = Object.entries(reverseFacilityMap)
        .filter(([name]) => name.includes(lowerSearch))
        .map(([_, id]) => id);

      const matchingNeedIds = Object.entries(reverseNeedMap)
        .filter(([name]) => name.includes(lowerSearch))
        .map(([_, id]) => id);

      whereCondition[Op.or] = [
        { candidate_name: { [Op.like]: `%${search}%` } },
        { post_code: { [Op.like]: `%${search}%` } },
        { address_line_1: { [Op.like]: `%${search}%` } },
        { address_line_2: { [Op.like]: `%${search}%` } },
        { place: { [Op.like]: `%${search}%` } },
        { status: { [Op.like]: `%${search}%` } },
        { form_status: { [Op.like]: `%${search}%` } },
        // Match IDs from mapping (careful with stringified arrays)
        ...(matchingJobIds.length
          ? [{ job_title: { [Op.regexp]: matchingJobIds.join("|") } }]
          : []),
        ...(matchingSkillIds.length
          ? [{ skills: { [Op.regexp]: matchingSkillIds.join("|") } }]
          : []),
        ...(matchingFacilityIds.length
          ? [{ care_facility: { [Op.regexp]: matchingFacilityIds.join("|") } }]
          : []),
        ...(matchingNeedIds.length
          ? [{ client_need: { [Op.regexp]: matchingNeedIds.join("|") } }]
          : []),
      ];
    }

    // Fetch candidates
    const { rows: candidates, count: total } = await Candidate.findAndCountAll({
      where: whereCondition,
      attributes: [
        "candidate_id",
        "candidate_name",
        "profile_img",
        "post_code",
        "address_line_1",
        "address_line_2",
        "landline_no",
        "place",
        "email_id",
        "countryCode",
        "mobile_number",
        "candidate_dob",
        "passport",
        "other_passport",
        "is_visa_for_uk",
        "experience",
        "job_title",
        "skills",
        "care_facility",
        "client_need",
        "upload_cv",
        "driver_car_owner",
        "dbs",
        "dbs_workforce_type",
        "current_salary",
        "desired_salary",
        "notice_period",
        "reason_for_leave",
        "current_position",
        "current_company_name",
        "w_u_consider",
        "advert_ref",
        "engine_name",
        "media_name",
        "ig",
        "fb",
        "twitter",
        "umbrella_company_name",
        "umbrella_company_email",
        "umbrella_company_number",
        "bank_name",
        "bank_address",
        "bank_sort_code",
        "account_number",
        "std_hour_rate",
        "sleep_hour",
        "weekend_pay",
        "bank_holiday_pay_rate",
        "national_insurance",
        "tiktok",
        "driver",
        "emergency_shift",
        "other_detail",
        "status",
        "storage_type",
        "form_status",
        "created_on",
        "refnow_id",
        "created_by",
        "updated_on",
        "updated_by",
        "is_deleted",
        "deleted_on",
        "deleted_by"
      ],
      limit,
      offset,
      order: [["created_on", "DESC"]], // latest first
    });

    if (!candidates.length) {
      logger.warn(`No candidates found - Page: ${page}, Search: ${search || 'none'}`);
      throw new ApiError(404, "No candidate info found");
    }

    const base_url = `${req.protocol}://${req.get("host")}`;

    // Map candidates with proper storage detection
    const result = candidates.map(c => {
      const isRemoteOrCloud = c.storage_type === "cloud" || c.storage_type === "remote";

      return {
        candidate_id: c.candidate_id,
        candidate_name: c.candidate_name,
        storage_type: c.storage_type,

        profile_img: c.profile_img
          ? isRemoteOrCloud
            ? c.profile_img
            : `${base_url}/uploads/profile/${c.profile_img}`
          : null,

        upload_cv: c.upload_cv
          ? isRemoteOrCloud
            ? c.upload_cv
            : `${base_url}/uploads/cv/${c.upload_cv}`
          : null,

        post_code: c.post_code,
        address_line_1: c.address_line_1,
        address_line_2: c.address_line_2,
        landline_no: c.landline_no,
        place: c.place,
        email_id: c.email_id,
        countryCode: c.countryCode,
        mobile_number: c.mobile_number,
        candidate_dob: c.candidate_dob,
        passport: c.passport,
        other_passport: c.other_passport,
        is_visa_for_uk: c.is_visa_for_uk,
        experience: c.experience,

        job_titles: c.job_title
          ? c.job_title.split(",").map(id => jobTitleMap[id.trim()] || null)
          : [],

        skills: c.skills
          ? c.skills.split(",").map(id => skillMap[id.trim()] || null)
          : [],

        facilities: c.care_facility
          ? c.care_facility.split(",").map(id => facilityMap[id.trim()] || null)
          : [],

        client_needs: c.client_need
          ? c.client_need.split(",").map(id => needMap[id.trim()] || null)
          : [],

        driver_car_owner: c.driver_car_owner,
        dbs: c.dbs,
        dbs_workforce_type: c.dbs_workforce_type,
        current_salary: c.current_salary,
        desired_salary: c.desired_salary,
        notice_period: c.notice_period,
        reason_for_leave: c.reason_for_leave,
        current_position: c.current_position,
        current_company_name: c.current_company_name,
        w_u_consider: c.w_u_consider,
        advert_ref: c.advert_ref,
        engine_name: c.engine_name,
        media_name: c.media_name,
        ig: c.ig,
        fb: c.fb,
        twitter: c.twitter,
        umbrella_company_name: c.umbrella_company_name,
        umbrella_company_email: c.umbrella_company_email,
        umbrella_company_number: c.umbrella_company_number,
        bank_name: c.bank_name,
        bank_address: c.bank_address,
        bank_sort_code: c.bank_sort_code,
        account_number: c.account_number,
        std_hour_rate: c.std_hour_rate,
        sleep_hour: c.sleep_hour,
        weekend_pay: c.weekend_pay,
        bank_holiday_pay_rate: c.bank_holiday_pay_rate,
        national_insurance: c.national_insurance,
        tiktok: c.tiktok,
        driver: c.driver,
        emergency_shift: c.emergency_shift,
        other_detail: c.other_detail,
        status: c.status,
        form_status: c.form_status,
        refnow_id: c.refnow_id,
        created_on: c.created_on,
        created_by: c.created_by,
        updated_on: c.updated_on,
        updated_by: c.updated_by,
        is_deleted: c.is_deleted,
        deleted_on: c.deleted_on,
        deleted_by: c.deleted_by,
      };
    });

    // console.log("result", result);  

    logger.info(`Fetched ${total} candidates successfully - Page: ${page}`);
    return res.status(200).json(
      new ApiResponse(200, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: result
      },
        search
          ? `Search results for '${search}'`
          : "All candidate info fetched successfully")
    );
  } catch (error) {
    logger.error(`Error fetching candidates: ${error.message}`);
    return res
      .status(500)
      .json(new ApiError(500, error.message, error, error.stack));
  }
};

const formAction = async (req, res) => {
  const t = await sequelize.transaction();  // START TRANSACTION

  try {
    const { id } = req.query;
    const { form_status, em_password } = req.body;

    logger.info(`Form action request - Candidate ID: ${id}, Status: ${form_status}`);

    const candidate = await Candidate.findOne({ where: { candidate_id: id }, transaction: t });

    if (!candidate) {
      await t.rollback();
      logger.warn(`Form action - Candidate not found - ID: ${id}`);
      return res.status(404).json(new ApiError(404, "Candidate not found"));
    }

    const validStatuses = [
      "FIRST_APPROVED",
      "APPROVED",
      "REJECTED",
    ];

    if (!validStatuses.includes(form_status)) {
      await t.rollback();
      logger.warn(`Form action - Invalid form status: ${form_status}`);
      return res.status(400).json(new ApiError(400, {}, "Invalid form_status value"));
    }

    const updateData = { form_status };

    // When APPROVED → Create Employee + Link

    if (form_status === "APPROVED") {

      if (!em_password) {
        await t.rollback();
        logger.warn(`Form action - Password required for approval - Candidate ID: ${id}`);
        return res.status(400).json({
          success: false,
          message: "Password is required when approving candidate"
        });
      }

      // Check duplicate employee
      const existingEmp = await Employee.findOne({
        where: { em_email: candidate.email_id },
        transaction: t
      });

      if (existingEmp) {
        await t.rollback();
        logger.warn(`Form action - Candidate already employee: ${candidate.email_id}`);
        return res.status(400).json({
          success: false,
          message: "Candidate already registered as employee"
        });
      }

      logger.info(`Creating employee for approved candidate - Candidate ID: ${id}, Email: ${candidate.email_id}`);

      // Generate ID
      const prefix = getPrefixFromRole("CANDIDATE");
      const em_id = await generateNextId(prefix);

      // Hash password
      const hashedPassword = crypto
        .createHash("sha1")
        .update(em_password)
        .digest("hex");

      // CREATE EMPLOYEE inside same transaction
      const newEmployee = await Employee.create(
        {
          em_id,
          first_name: candidate.candidate_name.split(" ")[0],
          last_name: candidate.candidate_name.split(" ")[1] || "",
          em_email: candidate.email_id,
          username: candidate.email_id,
          em_password: hashedPassword,
          em_role: "CANDIDATE",
          em_address: candidate.address_line_1,
          em_mobile_number: candidate.mobile_number,
          em_mobile_code: candidate.countryCode,
          em_birthday: candidate.candidate_dob,
          em_image: candidate.profile_img,
          em_joining_date: new Date().toISOString().slice(0, 10),
          status: "ACTIVE",
          role_id: 20,
          created_by: req.user?.id || null,
          created_on: new Date()
        },
        { transaction: t }
      );

      // Add em_id to candidate update
      updateData.em_id = newEmployee.em_id;
    }

    // Update candidate
    await Candidate.update(updateData, {
      where: { candidate_id: id },
      transaction: t,
    });

    // COMMIT both operations
    await t.commit();

    logger.info(`Form action completed successfully - Candidate ID: ${id}, Status: ${form_status}`);
    return res.status(200).json(
      new ApiResponse(
        200,
        updateData,
        "Status updated successfully!"
      )
    );

  } catch (error) {
    logger.error(`Error in form action: ${error.message}`);
    await t.rollback();  // ROLLBACK IF ANY ERROR
    return res
      .status(500)
      .json(new ApiError(500, error.message, error, error.stack));
  }
};

// const hireflixIntegration = async (req, res) => {
//   try {
//     const { positionId, firstName, lastName, email, phone } = req.body;

//     console.log("Hireflix invite request:", req.body);
//     const invite = await inviteCandidate(positionId, firstName, lastName, email, phone);

//     console.log("Hireflix invite result:", invite);

//     res.status(200).json({ publicUrl: invite.url.public, privateUrl: invite.url.private, inviteId: invite.id });
//   } catch (err) {
//     console.error("Hireflix invite error:", err.message || err);
//     let errorMessage = "Failed to invite candidate";

//     try {
//       const parsed = JSON.parse(err.message);
//       if (Array.isArray(parsed)) {
//         const hireflixError = parsed[0];
//         if (hireflixError.message === "candidate-already-exists") {
//           errorMessage = "This candidate has already been invited for this position.";
//         }
//       }
//     } catch (parseErr) { }

//     res.status(409).json({ error: errorMessage });
//   }

// }

// const hireflixGetPositions = async (req, res) => {
//   try {
//     const positions = await getPositions();
//     res.status(200).json({
//       data: positions
//     });
//   } catch (error) {
//     res.status(409).json({ error: error.message || "Failed to fetch positions" });
//   }
// }

// const hireflixInterviewData = async (req, res) => {
//   try {
//     const { interviewId } = req.params;

//     console.log("Fetching Hireflix interview data for ID:", interviewId);

//     const interviewData = await getInterviewData(interviewId);

//     console.log("Fetched Hireflix interview data:", interviewData);

//     res.status(200).json({
//       data: interviewData
//     });
//   } catch (error) {
//     res.status(409).json({ error: error.message || "Failed to fetch interview data" });
//   }
// }

// const hireflixStatusChange = async (req, res) => {
//   try {
//     const { interviewId, status } = req.body;


//     console.log("Updating Hireflix status for ID:", interviewId);

//     if (!interviewId || !status) {
//       return res.status(400).json({ error: "Missing interviewId or status" });
//     }
//     console.log(`Hireflix ${status} request:`, { interviewId });

//     let update;
//     if (status.toLowerCase() === 'approved') {
//       update = await updateInterviewFinalist(interviewId, true);
//     } else if (status.toLowerCase() === 'rejected') {
//       update = await updateInterviewDiscard(interviewId, true);
//     } else {
//       return res.status(400).json({ error: "Invalid status. Must be 'approved' or 'rejected'." });
//     }

//     console.log("Hireflix status result:", update);

//     res.status(200).json({
//       message: `Interview ${status.toLowerCase()} successfully`,
//       hireflix: update
//     });
//   } catch (err) {
//     console.error("Hireflix status error:", err.message || err);
//     res.status(500).json({ error: err.message || "Failed to update interview status" });
//   }
// };

const refnowGetRequests = async (req, res) => {
  try {
    logger.info("Fetching list of reference requests from RefNow");
    const requests = await listReferenceRequests();
    logger.info(`Reference requests fetched successfully - Count: ${requests?.length || 0}`);

    return res.status(200)
      .json(new ApiResponse(200, requests, "List of reference requests fetched successfully"));
  } catch (err) {
    logger.error(`Error fetching reference requests: ${err.message}`);
    return res.status(500)
      .json(new ApiError(500, err.message, err, err.stack));
  }
};

const refnowGetRequestById = async (req, res) => {
  try {
    const { id } = req.query;

    logger.info(`Fetching reference request - RID: ${id}`);

    const request = await getReferenceRequestById(id);

    logger.info(`Reference request fetched successfully - RID: ${id}`);

    return res.status(200)
      .json(new ApiResponse(200, request, "Reference request fetched successfully"));
  } catch (err) {
    logger.error(`Error fetching reference request ${id}: ${err.message}`);
    return res.status(500)
      .json(new ApiError(500, err.message, err, err.stack));
  }
};

const refnowGetQuestionProfiles = async (req, res) => {
  try {
    logger.info("Fetching question profiles from RefNow");

    const profiles = await getQuestionProfiles();

    logger.info(`Question profiles fetched successfully - Count: ${profiles?.length || 0}`);

    return res
      .status(200)
      .json(new ApiResponse(200, profiles, "Question profiles fetched successfully"));
  } catch (err) {
    logger.error(`Error fetching question profiles: ${err.message}`);
    return res
      .status(500)
      .json(new ApiError(500, err.message, err, err.stack));
  }
};

const refnowPostNewRequest = async (req, res) => {
  try {
    const requestData = req.body;
    logger.info(`Creating new reference request - Candidate ID: ${requestData.candidateId}`);

    const { candidateId } = requestData;


    const missingFields = [];
    if (!requestData.inputname) missingFields.push("inputname");
    if (!requestData.inputemail) missingFields.push("inputemail");
    if (!requestData.inputrefnum) missingFields.push("inputrefnum");
    if (!requestData.inputphone) missingFields.push("inputphone");
    if (!requestData.inputprofileid) missingFields.push("inputprofileid");

    if (missingFields.length) {
      logger.warn(`Reference request creation - Missing fields: ${missingFields.join(", ")}`);
      return res.status(400)
        .json(new ApiError(400, { missingFields }, "Error occurred: Missing required fields!"));
    }

    if (requestData.inputrefnum < 1 || requestData.inputrefnum > 10) {
      logger.warn(`Reference request creation - Invalid refnum: ${requestData.inputrefnum}`);
      return res.status(400)
        .json(new ApiError(400, { inputrefnum: requestData.inputrefnum }, "inputrefnum must be between 1 and 10"));
    }

    const newRequest = await postNewReferenceRequest(requestData);

    const rid = newRequest?.data?.[0]?.rid;

    logger.info(`Reference request created - Candidate ID: ${candidateId}, RID: ${rid}`);

    if (rid && candidateId) {
      await Candidate.update(
        { refnow_id: rid },
        { where: { candidate_id: candidateId } }
      );
    }

    return res.status(200)
      .json(new ApiResponse(200, newRequest, "Reference request created successfully"));

  } catch (err) {
    logger.error(`Error creating reference request: ${err.message}`);
    return res.status(500)
      .json(new ApiError(500, err.message, err, err.stack));
  }
};

const refnowGetCreditBalance = async (req, res) => {
  try {
    logger.info("Fetching RefNow credit balance");
    const balance = await getRefNowCreditBalance();
    logger.info(`RefNow credit balance fetched - Balance: ${balance.data?.[0]?.totalcreditbal || 0}`);

    if (balance.data?.[0].totalcreditbal === 0) {
      return res.status(200)
        .json(new ApiResponse(200, balance, "Credit balance is zero. Please recharge your RefNow account."));
    }
    return res.status(200)
      .json(new ApiResponse(200, balance, "RefNow Credit Balance fetched successfully"));
  } catch (err) {
    logger.error(`Error fetching RefNow credit balance: ${err.message}`);
    return res.status(500)
      .json(new ApiError(500, err.message, err, err.stack));
  }
};

const UpdateCandidateInfo = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { candidate_id } = req.query;
    const payload = req.body;

    logger.info(`Updating candidate info - Candidate ID: ${candidate_id}`);

    if (!candidate_id) {
      logger.warn("Update candidate - Missing candidate ID");
      return res.status(400).json(new ApiResponse(400, {}, "Candidate ID is required."));
    }

    if (Object.keys(payload).length === 0 && !req.uploadedFiles) {
      logger.warn(`Update candidate - Empty request body - Candidate ID: ${candidate_id}`);
      return res.status(400).json(new ApiResponse(400, {}, "Request body cannot be empty."));
    }

    const candidate = await Candidate.findByPk(candidate_id, { transaction: t });

    if (!candidate) {
      await t.rollback();
      logger.warn(`Update candidate - Candidate not found - ID: ${candidate_id}`);
      return res.status(404).json(new ApiResponse(404, {}, "Candidate not found."));
    }

    // --------------------------------------------------
    // Decide FINAL storage type
    // Rule:
    // - If UI sends storage_type → use it (explicit)
    // - Else → keep existing storage_type (implicit)
    // --------------------------------------------------
    const effectiveStorageType =
      req.storage_type || candidate.storage_type || "local";

    // --------------------------------------------------
    // File handling (storage-agnostic)
    // Middleware already returns:
    // local  → filename
    // cloud  → URL
    // remote → URL
    // --------------------------------------------------
    if (req.uploadedFiles) {
      if (req.uploadedFiles.upload_cv !== undefined) {
        payload.upload_cv = req.uploadedFiles.upload_cv;
      }

      if (req.uploadedFiles.profile_img !== undefined) {
        payload.profile_img = req.uploadedFiles.profile_img;
      }

      payload.storage_type = effectiveStorageType;
    }

    // Fields we NEVER allow updating
    const blockList = ["email_id", "candidate_id", "created_on", "created_by", "is_deleted"];

    // Update candidate fields dynamically
    Object.keys(payload).forEach(key => {
      if (
        payload[key] !== undefined && // don't overwrite with undefined
        candidate.dataValues.hasOwnProperty(key) &&
        !blockList.includes(key)
      ) {
        candidate[key] = payload[key];
      }
    });

    candidate.updated_by = req.user?.id || null;
    candidate.updated_on = new Date();

    await candidate.save({ transaction: t });

    // -------- EMPLOYEE UPDATE IF MAPPED --------
    if (candidate.em_id) {
      const employee = await Employee.findOne({
        where: { em_id: candidate.em_id },
        transaction: t,
      });

      if (employee) {
        const nameParts = candidate.candidate_name?.split(" ") || [];
        const firstName = nameParts[0] || employee.first_name;
        const lastName = nameParts.slice(1).join(" ") || employee.last_name;

        await employee.update({
          first_name: firstName,
          last_name: lastName,
          em_address: candidate.address_line_1 || employee.em_address,
          em_mobile_number: candidate.mobile_number || employee.em_mobile_number,
          em_mobile_code: candidate.countryCode || employee.em_mobile_code,
          em_image: candidate.profile_img || employee.em_image,
          updated_by: req.user?.id || null,
          updated_on: new Date(),
        }, { transaction: t });
      }
    }

    await t.commit();
    logger.info(`Candidate info updated successfully - Candidate ID: ${candidate_id}`);
    return res.status(200).json(new ApiResponse(200, candidate, "Candidate and mapped employee updated successfully."));
  } catch (err) {
    await t.rollback();
    logger.error(`Error updating candidate ${candidate_id}: ${err.message}`);
    return res.status(500).json(new ApiResponse(500, {}, err.message));
  }
};

const getFile = async (req, res) => {
  try {
    const { id } = req.query;

    logger.info(`Fetching CV file - Candidate ID: ${id}`);

    const record = await Candidate.findByPk(id);
    if (!record) {
      logger.warn(`Get file - Candidate not found - ID: ${id}`);
      return res.status(404).json({ message: "No file found" });
    }

    const fileName = record.upload_cv;

    const filePath = path.join(process.cwd(), "attach", "upload_cv", fileName);

    logger.info(`CV file sent - Candidate ID: ${id}, File: ${fileName}`);
    return res.sendFile(filePath);

  } catch (error) {
    logger.error(`Error fetching file: ${error.message}`);
    res.status(500).json({ message: "Error fetching file" });
  }
};

const getCandidateInfoById = async (req, res) => {
  try {
    const { candidate_id, profile_id } = req.query;
    logger.info(`Fetching candidate info - Candidate ID: ${candidate_id || 'N/A'}, Profile ID: ${profile_id || 'N/A'}`);

    // ---------------- ID validation ----------------
    if (!candidate_id && !profile_id) {
      logger.warn("Get candidate info - Missing candidate_id and profile_id");
      return res.status(400).json({
        success: false,
        message: "candidate_id or profile_id is required",
      });
    }

    let candidate;
    if (candidate_id) {
      candidate = await Candidate.findOne({ where: { candidate_id } });
    } else {
      candidate = await Candidate.findOne({
        where: { em_id: profile_id }, // or candidate_id if that’s intended
      });
    }

    if (!candidate) {
      logger.warn(`Get candidate info - Candidate not found - Candidate ID: ${candidate_id || 'N/A'}, Profile ID: ${profile_id || 'N/A'}`);
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    // Fetch master data for mapping
    const [jobTitles, skillsList, facilities, needs] = await Promise.all([
      job_title.findAll({ attributes: ["id", "name"] }),
      skills.findAll({ attributes: ["id", "name"] }),
      careFacility.findAll({ attributes: ["id", "facility_name"] }),
      client_needs.findAll({ attributes: ["id", "name"] }),
    ]);

    // Create maps
    const jobTitleMap = Object.fromEntries(jobTitles.map(j => [j.id, j.name]));
    const skillMap = Object.fromEntries(skillsList.map(s => [s.id, s.name]));
    const facilityMap = Object.fromEntries(facilities.map(f => [f.id, f.facility_name]));
    const needMap = Object.fromEntries(needs.map(n => [n.id, n.name]));

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // ✅ Final storage detection
    const isRemoteOrCloud =
      candidate.storage_type === "cloud" ||
      candidate.storage_type === "remote";

    const result = {
      candidate_id: candidate.candidate_id,
      em_id: candidate.em_id,
      candidate_name: candidate.candidate_name,
      storage_type: candidate.storage_type || "local",

      profile_img: candidate.profile_img
        ? isRemoteOrCloud
          ? candidate.profile_img
          : `${baseUrl}/uploads/profile/${candidate.profile_img}`
        : null,

      upload_cv: candidate.upload_cv
        ? isRemoteOrCloud
          ? candidate.upload_cv
          : `${baseUrl}/uploads/cv/${candidate.upload_cv}`
        : null,

      post_code: candidate.post_code,
      address_line_1: candidate.address_line_1,
      address_line_2: candidate.address_line_2,
      landline_no: candidate.landline_no,
      place: candidate.place,
      email_id: candidate.email_id,
      countryCode: candidate.countryCode,
      mobile_number: candidate.mobile_number,
      candidate_dob: candidate.candidate_dob,
      passport: candidate.passport,
      other_passport: candidate.other_passport,
      is_visa_for_uk: candidate.is_visa_for_uk,
      experience: candidate.experience,

      job_titles: candidate.job_title
        ? candidate.job_title.split(",").map(id => jobTitleMap[id.trim()] || null)
        : [],
      skills: candidate.skills
        ? candidate.skills.split(",").map(id => skillMap[id.trim()] || null)
        : [],
      facilities: candidate.care_facility
        ? candidate.care_facility.split(",").map(id => facilityMap[id.trim()] || null)
        : [],
      client_needs: candidate.client_need
        ? candidate.client_need.split(",").map(id => needMap[id.trim()] || null)
        : [],

      driver_car_owner: candidate.driver_car_owner,
      dbs: candidate.dbs,
      dbs_workforce_type: candidate.dbs_workforce_type,
      current_salary: candidate.current_salary,
      desired_salary: candidate.desired_salary,
      notice_period: candidate.notice_period,
      reason_for_leave: candidate.reason_for_leave,
      current_position: candidate.current_position,
      current_company_name: candidate.current_company_name,
      w_u_consider: candidate.w_u_consider,
      advert_ref: candidate.advert_ref,
      engine_name: candidate.engine_name,
      media_name: candidate.media_name,
      ig: candidate.ig,
      fb: candidate.fb,
      twitter: candidate.twitter,
      umbrella_company_name: candidate.umbrella_company_name,
      umbrella_company_email: candidate.umbrella_company_email,
      umbrella_company_number: candidate.umbrella_company_number,
      bank_name: candidate.bank_name,
      bank_address: candidate.bank_address,
      bank_sort_code: candidate.bank_sort_code,
      account_number: candidate.account_number,
      std_hour_rate: candidate.std_hour_rate,
      sleep_hour: candidate.sleep_hour,
      weekend_pay: candidate.weekend_pay,
      bank_holiday_pay_rate: candidate.bank_holiday_pay_rate,
      national_insurance: candidate.national_insurance,
      tiktok: candidate.tiktok,
      driver: candidate.driver,
      emergency_shift: candidate.emergency_shift,
      other_detail: candidate.other_detail,
      status: candidate.status,
      form_status: candidate.form_status,
      refnow_id: candidate.refnow_id,
      created_on: candidate.created_on,
      created_by: candidate.created_by,
      updated_on: candidate.updated_on,
      updated_by: candidate.updated_by,
      is_deleted: candidate.is_deleted,
      deleted_on: candidate.deleted_on,
      deleted_by: candidate.deleted_by,
    };

    logger.info(`Candidate info fetched successfully - Candidate ID: ${candidate.candidate_id}`);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error(`Error fetching candidate info: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCandidateInfoByEmId = async (req, res) => {
  try {
    const { profile_id } = req.query;
    logger.info(`Fetching candidate info by EM ID - Profile ID: ${profile_id}`);

    if (!profile_id) {
      logger.warn("Get candidate by EM ID - Missing profile_id");
      return res.status(400).json({ success: false, message: "profile_id is required" });
    }

    const [jobTitles, skillsList, facilities, needs] = await Promise.all([
      job_title.findAll({ attributes: ["id", "name"] }),
      skills.findAll({ attributes: ["id", "name"] }),
      careFacility.findAll({ attributes: ["id", "facility_name"] }),
      client_needs.findAll({ attributes: ["id", "name"] }),
    ]);

    const jobTitleMap = Object.fromEntries(jobTitles.map(j => [j.id, j.name]));
    const skillMap = Object.fromEntries(skillsList.map(s => [s.id, s.name]));
    const facilityMap = Object.fromEntries(facilities.map(f => [f.id, f.facility_name]));
    const needMap = Object.fromEntries(needs.map(n => [n.id, n.name]));

    const candidate = await Candidate.findOne({
      where: { em_id: profile_id }, // or candidate_id if that’s intended
    });

    if (!candidate) {
      logger.warn(`Get candidate by EM ID - Candidate not found - Profile ID: ${profile_id}`);
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // ✅ Defensive storage handling
    const storageType = candidate.storage_type || "local";
    const isRemoteOrCloud = ["cloud", "remote"].includes(storageType);
    // ---------------- Response mapping ----------------
    const result = {
      candidate_id: candidate.candidate_id,
      em_id: candidate.em_id,
      candidate_name: candidate.candidate_name,
      storage_type: storageType,

      profile_img: candidate.profile_img
        ? isRemoteOrCloud
          ? candidate.profile_img
          : `${baseUrl}/uploads/profile/${candidate.profile_img}`
        : null,

      upload_cv: candidate.upload_cv
        ? isRemoteOrCloud
          ? candidate.upload_cv
          : `${baseUrl}/uploads/cv/${candidate.upload_cv}`
        : null,

      post_code: candidate.post_code,
      address_line_1: candidate.address_line_1,
      address_line_2: candidate.address_line_2,
      landline_no: candidate.landline_no,
      place: candidate.place,
      email_id: candidate.email_id,
      countryCode: candidate.countryCode,
      mobile_number: candidate.mobile_number,
      candidate_dob: candidate.candidate_dob,
      passport: candidate.passport,
      other_passport: candidate.other_passport,
      is_visa_for_uk: candidate.is_visa_for_uk,
      experience: candidate.experience,

      job_titles: candidate.job_title
        ? candidate.job_title.split(",").map(id => jobTitleMap[id.trim()] || null)
        : [],

      skills: candidate.skills
        ? candidate.skills.split(",").map(id => skillMap[id.trim()] || null)
        : [],

      facilities: candidate.care_facility
        ? candidate.care_facility.split(",").map(id => facilityMap[id.trim()] || null)
        : [],

      client_needs: candidate.client_need
        ? candidate.client_need.split(",").map(id => needMap[id.trim()] || null)
        : [],

      driver_car_owner: candidate.driver_car_owner,
      dbs: candidate.dbs,
      dbs_workforce_type: candidate.dbs_workforce_type,
      current_salary: candidate.current_salary,
      desired_salary: candidate.desired_salary,
      notice_period: candidate.notice_period,
      reason_for_leave: candidate.reason_for_leave,
      current_position: candidate.current_position,
      current_company_name: candidate.current_company_name,
      w_u_consider: candidate.w_u_consider,
      advert_ref: candidate.advert_ref,
      engine_name: candidate.engine_name,
      media_name: candidate.media_name,
      ig: candidate.ig,
      fb: candidate.fb,
      twitter: candidate.twitter,
      umbrella_company_name: candidate.umbrella_company_name,
      umbrella_company_email: candidate.umbrella_company_email,
      umbrella_company_number: candidate.umbrella_company_number,
      bank_name: candidate.bank_name,
      bank_address: candidate.bank_address,
      bank_sort_code: candidate.bank_sort_code,
      account_number: candidate.account_number,
      std_hour_rate: candidate.std_hour_rate,
      sleep_hour: candidate.sleep_hour,
      weekend_pay: candidate.weekend_pay,
      bank_holiday_pay_rate: candidate.bank_holiday_pay_rate,
      national_insurance: candidate.national_insurance,
      tiktok: candidate.tiktok,
      driver: candidate.driver,
      emergency_shift: candidate.emergency_shift,
      other_detail: candidate.other_detail,
      status: candidate.status,
      form_status: candidate.form_status,
      refnow_id: candidate.refnow_id,
      created_on: candidate.created_on,
      created_by: candidate.created_by,
      updated_on: candidate.updated_on,
      updated_by: candidate.updated_by,
      is_deleted: candidate.is_deleted,
      deleted_on: candidate.deleted_on,
      deleted_by: candidate.deleted_by,
    };

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {
    logger.error(`Error fetching candidate info by EM ID: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const saveCandidateInterview = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { candidate_id, interview_id, interview_questions } = req.body;
    logger.info(`Saving candidate interview - Candidate ID: ${candidate_id}, Interview ID: ${interview_id}`);

    if (!candidate_id) {
      logger.warn("Save interview - Missing candidate_id");
      return res.status(400).json({ message: "candidate_id is required" });
    }

    if (!interview_id) {
      logger.warn("Save interview - Missing interview_id");
      return res.status(400).json({ message: "interview_id is required" });
    }

    const candidate = await Candidate.findByPk(candidate_id, {
      transaction: t
    });

    if (!candidate) {
      await t.rollback();
      logger.warn(`Save interview - Candidate not found - ID: ${candidate_id}`);
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Prevent re-submission for same interview
    const existingInterview = await CandidateInterview.findOne({
      where: { candidate_id, interview_id, is_deleted: "N" },
      transaction: t
    });

    if (existingInterview) {
      await t.rollback();
      logger.warn(`Save interview - Interview already submitted - Candidate ID: ${candidate_id}, Interview ID: ${interview_id}`);
      return res.status(400).json({
        message: "Interview already submitted for this interview_id. Updates are not allowed."
      });
    }

    // Storage type
    const storageType = req.storage_type || "local";

    // Uploaded videos
    const videoAnswers = req.uploadedFiles?.interview_video_answers || [];

    if (!Array.isArray(videoAnswers) || !videoAnswers.length) {
      await t.rollback();
      logger.warn(`Save interview - No video answers provided - Candidate ID: ${candidate_id}`);
      return res.status(400).json({
        message: "At least one interview video is required"
      });
    }

    // Parse interview questions
    let parsedQuestions = [];

    try {
      parsedQuestions = interview_questions
        ? typeof interview_questions === "string"
          ? JSON.parse(interview_questions)
          : interview_questions
        : [];
    } catch {
      parsedQuestions = [];
    }

    if (!Array.isArray(parsedQuestions) || !parsedQuestions.length) {
      await t.rollback();
      logger.warn(`Save interview - Invalid questions format - Candidate ID: ${candidate_id}`);
      return res.status(400).json({
        message: "interview_questions must be a non-empty array"
      });
    }

    if (videoAnswers.length !== parsedQuestions.length) {
      await t.rollback();
      logger.warn(`Save interview - Video and question count mismatch - Candidate ID: ${candidate_id}`);
      return res.status(400).json({
        message: "interview_questions and interview_video_answers must have the same length"
      });
    }

    const missingVideo = videoAnswers.findIndex(video => !video);
    if (missingVideo !== -1) {
      await t.rollback();
      logger.warn(`Save interview - Missing video for question index ${missingVideo} - Candidate ID: ${candidate_id}`);
      return res.status(400).json({
        message: "Each interview question must have a corresponding video"
      });
    }

    const missingQuestionId = parsedQuestions.find(question =>
      !(question?.interview_question_id ?? question?.id ?? question?.question_id)
    );

    if (missingQuestionId) {
      await t.rollback();
      logger.warn(`Save interview - Missing interview_question_id - Candidate ID: ${candidate_id}`);
      return res.status(400).json({
        message: "Each interview question must include interview_question_id"
      });
    }

    logger.info(`Interview validation passed - Candidate ID: ${candidate_id}, Interview ID: ${interview_id}, Videos: ${videoAnswers.length}`);

    const interviewRecords = parsedQuestions.map((question, index) => {
      const interviewQuestionId =
        question?.interview_question_id ?? question?.id ?? question?.question_id;

      return {
        candidate_id,
        interview_id,
        interview_question_id: interviewQuestionId,
        question_answer: question?.question_answer ?? question?.answer ?? question?.transcription ?? null,
        question_video_url: videoAnswers[index] ?? question?.question_video_url ?? question?.video_url ?? null,
        storage_type: storageType,
        created_on: new Date(),
        created_by: req.user?.id || null,
        status: "1",
        is_deleted: "N"
      };
    });

    await CandidateInterview.bulkCreate(interviewRecords, { transaction: t });

    // Update candidate_register to mark interview as completed
    await Candidate.update(
      { interview_completed: "1" },
      { where: { candidate_id }, transaction: t }
    );

    await t.commit();

    logger.info(`Interview saved successfully - Candidate ID: ${candidate_id}, Interview ID: ${interview_id}`);

    return res.status(200).json({
      message: "Interview submitted successfully",
      candidate_id,
      interview_id,
      storage_type: storageType,
      saved_count: interviewRecords.length,
      interview_completed: "1"
    });

  } catch (err) {
    await t.rollback();
    logger.error(`Error saving interview: ${err.message}`);
    return res.status(500).json({ message: err.message });
  }
};

const getCandidateInterview = async (req, res) => {
  try {
    const { candidate_id, interview_id } = req.query;
    logger.info(`Fetching candidate interview - Candidate ID: ${candidate_id}, Interview ID: ${interview_id}`);

    if (!candidate_id) {
      logger.warn("Get interview - Missing candidate_id");
      return res.status(400).json({
        success: false,
        message: "candidate_id is required"
      });
    }

    const candidate = await Candidate.findByPk(candidate_id);
    if (!candidate) {
      logger.warn(`Get interview - Candidate not found - ID: ${candidate_id}`);
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    const whereClause = { candidate_id, is_deleted: "N" };
    if (interview_id) {
      whereClause.interview_id = interview_id;
    }

    const interviewRows = await CandidateInterview.findAll({
      where: whereClause,
      order: [
        ["interview_id", "ASC"],
        ["interview_question_id", "ASC"],
        ["id", "ASC"]
      ]
    });

    if (!interviewRows || interviewRows.length === 0) {
      logger.info(`Get interview - No interview records - Candidate ID: ${candidate_id}`);
      return res.status(200).json({
        success: true,
        interview_completed: false,
        interview_data: []
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Load questions for mapping (supports both composite key and raw ID usage)
    const interviewIds = [...new Set(interviewRows.map(row => row.interview_id))];
    let questionMapByComposite = new Map();
    let questionMapById = new Map();

    if (interviewIds.length) {
      const questions = await InterviewQuestion.findAll({
        where: {
          interview_id: { [Op.in]: interviewIds },
          is_deleted: "N"
        }
      });

      questions.forEach(q => {
        questionMapByComposite.set(`${q.interview_id}:${q.interview_question_id}`, q.interview_question);
        questionMapById.set(String(q.id), q.interview_question);
      });
    }

    const interviewData = interviewRows.map(row => {
      const storageType = row.storage_type || "local";
      const isRemoteOrCloud = ["cloud", "remote"].includes(storageType);
      const videoUrl = row.question_video_url
        ? isRemoteOrCloud
          ? row.question_video_url
          : `${baseUrl}/uploads/interview/videos/${row.question_video_url}`
        : null;

      const questionText =
        questionMapByComposite.get(`${row.interview_id}:${row.interview_question_id}`) ||
        questionMapById.get(String(row.interview_question_id)) ||
        null;

      return {
        candidate_id: row.candidate_id,
        interview_id: row.interview_id,
        interview_question_id: row.interview_question_id,
        interview_question: questionText,
        question_answer: row.question_answer ?? null,
        video_answer: videoUrl,
        storage_type: storageType,
        created_on: row.created_on || null
      };
    });

    const interviewCompletedAt = interviewRows.reduce((latest, row) => {
      if (!latest) return row.created_on || null;
      if (!row.created_on) return latest;
      return new Date(row.created_on) > new Date(latest) ? row.created_on : latest;
    }, null);

    logger.info(`Interview fetched successfully - Candidate ID: ${candidate_id}, Records: ${interviewRows.length}`);

    return res.status(200).json({
      success: true,
      interview_completed: candidate.interview_completed,
      interview_completed_at: interviewCompletedAt,
      interview_data: interviewData
    });

  } catch (error) {
    logger.error(`Error fetching candidate interview: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export {
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
}