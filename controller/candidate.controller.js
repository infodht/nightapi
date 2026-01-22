import { Candidate } from "../model/candidate.model.js";
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

    // Validation
    if (!candidate_name || !post_code || !address_line_1 || !place || !email_id || !candidate_dob || !passport || !experience || !countryCode || !skills) {
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
      throw new ApiError(409, "Email already registered");
    }

    // Create new candidate
    if (!candidateId) {
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

      return res
        .status(201)
        .json(new ApiResponse(201, newCandidate, "Successfully Candidate Registered"));
    }
  } catch (error) {
    console.error(`Candidate registration error: ${error}`);
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
        "position_title",
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
        position_title: c.position_title,
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
    return res
      .status(500)
      .json(new ApiError(500, error.message, error, error.stack));
  }
};

const formAction = async (req, res) => {
  const t = await sequelize.transaction();  // START TRANSACTION

  try {
    const { id } = req.query;
    const { form_status, position_title, em_password } = req.body;

    console.log(req.body);

    const candidate = await Candidate.findOne({ where: { candidate_id: id }, transaction: t });

    if (!candidate) {
      await t.rollback();
      return res.status(404).json(new ApiError(404, "Candidate not found"));
    }

    const validStatuses = [
      "FIRST_APPROVED",
      "APPROVED",
      "REJECTED",
    ];

    if (!validStatuses.includes(form_status)) {
      await t.rollback();
      return res.status(400).json(new ApiError(400, {}, "Invalid form_status value"));
    }

    const updateData = { form_status };

    if (position_title) updateData.position_title = position_title;

    // When APPROVED → Create Employee + Link

    if (form_status === "APPROVED") {

      if (!em_password) {
        await t.rollback();
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
        return res.status(400).json({
          success: false,
          message: "Candidate already registered as employee"
        });
      }

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

    return res.status(200).json(
      new ApiResponse(
        200,
        updateData,
        "Status updated successfully!"
      )
    );

  } catch (error) {
    console.error("Error in formAction:", error);
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
    console.log("Fetching List of reference requests");
    const requests = await listReferenceRequests();
    console.log("List of reference requests fetched:", requests);

    return res.status(200)
      .json(new ApiResponse(200, requests, "List of reference requests fetched successfully"));
  } catch (err) {
    console.error("Error while fetching list of reference requests:", err);
    return res.status(500)
      .json(new ApiError(500, err.message, err, err.stack));
  }
};

const refnowGetRequestById = async (req, res) => {
  try {
    const { id } = req.query;

    console.log("Fetching a reference request with rid:", id);

    const request = await getReferenceRequestById(id);

    console.log("Reference request fetched:", request);

    return res.status(200)
      .json(new ApiResponse(200, request, "Reference request fetched successfully"));
  } catch (err) {
    console.error("Error while fetching reference request:", err);
    return res.status(500)
      .json(new ApiError(500, err.message, err, err.stack));
  }
};

const refnowGetQuestionProfiles = async (req, res) => {
  try {
    console.log("Fetching Question Profiles from RefNow...");

    const profiles = await getQuestionProfiles();

    console.log("Question Profiles fetched:", profiles?.length || 0);

    return res
      .status(200)
      .json(new ApiResponse(200, profiles, "Question profiles fetched successfully"));
  } catch (err) {
    console.error("Error while fetching question profiles:", err);
    return res
      .status(500)
      .json(new ApiError(500, err.message, err, err.stack));
  }
};

const refnowPostNewRequest = async (req, res) => {
  try {
    const requestData = req.body;
    console.log("Creating a new reference request with payload:", requestData);

    const { candidateId } = requestData;


    const missingFields = [];
    if (!requestData.inputname) missingFields.push("inputname");
    if (!requestData.inputemail) missingFields.push("inputemail");
    if (!requestData.inputrefnum) missingFields.push("inputrefnum");
    if (!requestData.inputphone) missingFields.push("inputphone");
    if (!requestData.inputprofileid) missingFields.push("inputprofileid");

    if (missingFields.length) {
      return res.status(400)
        .json(new ApiError(400, { missingFields }, "Error occurred: Missing required fields!"));
    }

    if (requestData.inputrefnum < 1 || requestData.inputrefnum > 10) {
      return res.status(400)
        .json(new ApiError(400, { inputrefnum: requestData.inputrefnum }, "inputrefnum must be between 1 and 10"));
    }

    const newRequest = await postNewReferenceRequest(requestData);
    console.log("Reference request successfully created:", newRequest);

    const rid = newRequest?.data?.[0]?.rid;

    console.log("Candidate ID:", candidateId);
    console.log("RID:", rid);

    if (rid && candidateId) {
      await Candidate.update(
        { refnow_id: rid },
        { where: { candidate_id: candidateId } }
      );
    }

    return res.status(200)
      .json(new ApiResponse(200, newRequest, "Reference request created successfully"));

  } catch (err) {
    console.error("Error while creating reference request:", err);
    return res.status(500)
      .json(new ApiError(500, err.message, err, err.stack));
  }
};

const refnowGetCreditBalance = async (req, res) => {
  try {
    console.log("Fetching RefNow Credit Balance...");
    const balance = await getRefNowCreditBalance();
    console.log("RefNow Credit Balance fetched:", balance);

    if (balance.data?.[0].totalcreditbal === 0) {
      return res.status(200)
        .json(new ApiResponse(200, balance, "Credit balance is zero. Please recharge your RefNow account."));
    }
    return res.status(200)
      .json(new ApiResponse(200, balance, "RefNow Credit Balance fetched successfully"));
  } catch (err) {
    console.error("Error while fetching RefNow Credit Balance:", err);
    return res.status(500)
      .json(new ApiError(500, err.message, err, err.stack));
  }
};

const UpdateCandidateInfo = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { candidate_id } = req.query;
    const payload = req.body;

    if (!candidate_id) {
      return res.status(400).json(new ApiResponse(400, {}, "Candidate ID is required."));
    }

    if (Object.keys(payload).length === 0 && !req.uploadedFiles) {
      return res.status(400).json(new ApiResponse(400, {}, "Request body cannot be empty."));
    }

    const candidate = await Candidate.findByPk(candidate_id, { transaction: t });

    if (!candidate) {
      await t.rollback();
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
    return res.status(200).json(new ApiResponse(200, candidate, "Candidate and mapped employee updated successfully."));
  } catch (err) {
    await t.rollback();
    console.error("Error updating candidate:", err);
    return res.status(500).json(new ApiResponse(500, {}, err.message));
  }
};

const getFile = async (req, res) => {
  try {
    const { id } = req.query;

    console.log(`file id ${id}`)

    const record = await Candidate.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "No file found" });
    }

    console.log(`record ${record}`)

    // const folder = record.uploads;
    const fileName = record.upload_cv;

    console.log(`file name , ${fileName}`)

    const filePath = path.join(process.cwd(), "attach", "upload_cv", fileName);

    console.log(`filepath ${filePath}`)

    return res.sendFile(filePath);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching file" });
  }
};

const getCandidateInfoById = async (req, res) => {
  try {
    const { candidate_id, profile_id } = req.query;

    // ---------------- ID validation ----------------
    if (!candidate_id && !profile_id) {
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

    // ---------------- Interview data mapping ----------------
    let interviewQuestions = [];
    let interviewVideos = [];

    try {
      interviewQuestions = candidate.interview_questions
        ? JSON.parse(candidate.interview_questions)
        : [];
    } catch {
      interviewQuestions = [];
    }

    try {
      interviewVideos = candidate.interview_video_answers
        ? JSON.parse(candidate.interview_video_answers)
        : [];
    } catch {
      interviewVideos = [];
    }

    const interviewData = [];
    const maxLength = Math.max(interviewQuestions.length, interviewVideos.length);

    for (let i = 0; i < maxLength; i++) {
      interviewData.push({
        question: interviewQuestions[i] || null,
        video_answer: interviewVideos[i]
          ? isRemoteOrCloud
            ? interviewVideos[i]
            : `${baseUrl}/attach/interview/videos/${interviewVideos[i]}`
          : null,
      });
    }

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
      position_title: candidate.position_title,
      refnow_id: candidate.refnow_id,
      created_on: candidate.created_on,
      created_by: candidate.created_by,
      updated_on: candidate.updated_on,
      updated_by: candidate.updated_by,
      is_deleted: candidate.is_deleted,
      deleted_on: candidate.deleted_on,
      deleted_by: candidate.deleted_by,
      interview_data: interviewData,
      interview_completed_at: candidate.interview_completed_at || null
    };

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCandidateInfoByEmId = async (req, res) => {
  try {
    const { profile_id } = req.query;

    if (!profile_id) {
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
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // ✅ Defensive storage handling
    const storageType = candidate.storage_type || "local";
    const isRemoteOrCloud = ["cloud", "remote"].includes(storageType);

    // ---------------- Interview data ----------------
    let interviewQuestions = [];
    let interviewVideos = [];

    try {
      interviewQuestions = candidate.interview_questions
        ? JSON.parse(candidate.interview_questions)
        : [];
    } catch {
      interviewQuestions = [];
    }

    try {
      interviewVideos = candidate.interview_video_answers
        ? JSON.parse(candidate.interview_video_answers)
        : [];
    } catch {
      interviewVideos = [];
    }

    const interviewData = [];
    const maxLength = Math.max(
      interviewQuestions.length,
      interviewVideos.length
    );

    for (let i = 0; i < maxLength; i++) {
      interviewData.push({
        question: interviewQuestions[i] || null,
        video_answer: interviewVideos[i]
          ? isRemoteOrCloud
            ? interviewVideos[i]
            : `${baseUrl}/attach/interview/videos/${interviewVideos[i]}`
          : null,
      });
    }

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
      position_title: candidate.position_title,
      refnow_id: candidate.refnow_id,
      created_on: candidate.created_on,
      created_by: candidate.created_by,
      updated_on: candidate.updated_on,
      updated_by: candidate.updated_by,
      is_deleted: candidate.is_deleted,
      deleted_on: candidate.deleted_on,
      deleted_by: candidate.deleted_by,

      interview_data: interviewData,
      interview_completed_at: candidate.interview_completed_at || null,
    };

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const saveCandidateInterview = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { candidate_id, interview_questions } = req.body;

    if (!candidate_id) {
      return res.status(400).json({ message: "candidate_id is required" });
    }

    const candidate = await Candidate.findByPk(candidate_id, {
      transaction: t
    });

    if (!candidate) {
      await t.rollback();
      return res.status(404).json({ message: "Candidate not found" });
    }

    /**
     * ❌ Block re-submission
     * Interview can be submitted ONLY ONCE
     */
    if (candidate.interview_completed_at) {
      await t.rollback();
      return res.status(400).json({
        message: "Interview already submitted. Updates are not allowed."
      });
    }

    /**
     * ---------------- STORAGE TYPE HANDLING ----------------
     * Rule:
     * - If UI sends storage_type → use it (explicit)
     * - Else → keep existing (implicit)
     * - Default → local
     */
    const storageType =
      req.storage_type || candidate.storage_type || "local";

    /**
     * 🎥 Interview video answers
     * Comes from handleUpload:
     * local  → filename
     * cloud  → URL
     * remote → URL
     */
    const videoAnswers =
      req.uploadedFiles?.interview_video_answers || [];

    if (!Array.isArray(videoAnswers) || !videoAnswers.length) {
      await t.rollback();
      return res.status(400).json({
        message: "At least one interview video is required"
      });
    }

    /**
     * ❓ Interview questions
     * Can come as JSON string or array
     */
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
      return res.status(400).json({
        message: "interview_questions must be a non-empty array"
      });
    }

    /**
     * ✅ Save interview data
     */
    candidate.interview_questions = parsedQuestions;           // stored as array / JSON
    candidate.interview_video_answers = videoAnswers;          // filenames or URLs
    candidate.storage_type = storageType;                      // 🔑 IMPORTANT
    candidate.interview_completed_at = new Date();
    candidate.updated_on = new Date();
    candidate.updated_by = req.user?.id || null;

    await candidate.save({ transaction: t });
    await t.commit();

    return res.status(200).json({
      message: "Interview submitted successfully",
      candidate_id: candidate.candidate_id,
      storage_type: storageType,
      interview_questions: candidate.interview_questions,
      interview_video_answers: candidate.interview_video_answers,
      interview_completed_at: candidate.interview_completed_at
    });

  } catch (err) {
    await t.rollback();
    console.error("Interview Save Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

const getCandidateInterview = async (req, res) => {
  try {
    const { candidate_id } = req.query;

    if (!candidate_id) {
      return res.status(400).json({
        success: false,
        message: "candidate_id is required"
      });
    }

    const candidate = await Candidate.findOne({
      where: { candidate_id },
      attributes: [
        "candidate_id",
        "storage_type",
        "interview_questions",
        "interview_video_answers",
        "interview_completed_at"
      ]
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    // Interview not submitted yet
    if (!candidate.interview_completed_at) {
      return res.status(200).json({
        success: true,
        interview_completed: false,
        interview_data: []
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // ✅ Defensive storage handling
    const storageType = candidate.storage_type || "local";
    const isRemoteOrCloud = ["cloud", "remote"].includes(storageType);

    // ---------------- Parse stored data safely ----------------
    let questions = [];
    let videos = [];

    try {
      questions = Array.isArray(candidate.interview_questions)
        ? candidate.interview_questions
        : JSON.parse(candidate.interview_questions || "[]");
    } catch {
      questions = [];
    }

    try {
      videos = Array.isArray(candidate.interview_video_answers)
        ? candidate.interview_video_answers
        : JSON.parse(candidate.interview_video_answers || "[]");
    } catch {
      videos = [];
    }

    const interviewData = [];
    const maxLength = Math.max(questions.length, videos.length);

    for (let i = 0; i < maxLength; i++) {
      interviewData.push({
        question: questions[i] || null,
        video_answer: videos[i]
          ? isRemoteOrCloud
            ? videos[i] // cloud / remote → URL already
            : `${baseUrl}/attach/interview/videos/${videos[i]}`
          : null
      });
    }

    return res.status(200).json({
      success: true,
      interview_completed: true,
      storage_type: storageType,
      interview_completed_at: candidate.interview_completed_at,
      interview_data: interviewData
    });

  } catch (error) {
    console.error("Get Interview Error:", error);
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