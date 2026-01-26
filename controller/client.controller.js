import { Client } from "../model/client.model.js";
import { ClientRegistration } from "../model/client2.model.js";
import { shift_patterns } from "../model/shift_patterns.model.js";
import { Payrate } from "../model/payrate.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { client_needs } from '../model/client_needs.model.js';
import { careFacility } from '../model/care_facility.model.js';
import { Op } from "sequelize";
import { job_title } from "../model/job_title.model.js";
import { Employee } from "../model/employee.model.js";
import { sequelize } from "../database/db.connection.js";
import crypto from "crypto";
import logger from '../logger/logger.js';
import { getPrefixFromRole, generateNextId } from "../controller/employee.controller.js";

const registerClient = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      client_id,
      client_organisation,
      parent_entity,
      post_code,
      postal_address,
      address_list,
      vat_number,
      company_reg_number,
      website,
      monthly_cost,
      subscription,
      monthly_payroll,
      payroll_timesheet,
      no_payroll,
      contact_name,
      contact_position,
      contact_email,
      contact_number,
      lane_code,
      contact_mobile,
      mobile_code,
      finance_name,
      finance_position,
      finance_number,
      finance_mobile_code,
      finance_mobile,
      finance_email,
      finance_entity_address,
      finance_credit_limit,
      billing_name,
      billing_position,
      billing_number,
      billing_mobile_code,
      billing_mobile,
      billing_email,
      billing_entity_address,
      step2_data,
      shift_pattern,
      payrate,
      em_password
    } = req.body;

    logger.info(`Client registration request - Email: ${contact_email}, Organization: ${client_organisation}`);

    if (!em_password) {
      logger.warn(`Client registration - Password required - Email: ${contact_email}`);
      throw new Error("Password required for creating employee");
    }

    /* ================= FILES FROM MULTER ================= */
    const client_logo = req.uploadedFiles?.client_logo || null;
    const uploadFile = req.uploadedFiles?.upload || null;

    /* ================= CHECK EXISTENCE ================= */
    const employeeExists = await Employee.findOne({
      where: { em_email: contact_email },
      transaction: t
    });

    const clientExists = await Client.findOne({
      where: { main_email: contact_email },
      transaction: t
    });

    if (employeeExists || clientExists) {
      await t.rollback();
      logger.warn(`Client registration - Email already registered: ${contact_email}`);
      return res.status(400).json({
        status: 400,
        success: false,
        message: "This email is already registered as an employee or client."
      });
    }

    /* ================= CREATE EMPLOYEE ================= */
    logger.info(`Creating employee for client registration - Email: ${contact_email}, ID: ${contact_name}`);
    const prefix = getPrefixFromRole("CLIENT");
    const em_id = await generateNextId(prefix);

    const hashedPassword = crypto
      .createHash("sha1")
      .update(em_password)
      .digest("hex");

    const nameParts = contact_name.trim().split(" ");
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(" ");

    const employee = await Employee.create({
      em_id,
      first_name,
      last_name,
      em_email: contact_email,
      username: contact_email,
      em_password: hashedPassword,
      em_role: "CLIENT",
      em_address: address_list,
      em_mobile_number: contact_mobile,
      em_mobile_code: mobile_code,
      em_image: client_logo,
      em_joining_date: new Date().toISOString().slice(0, 10),
      status: "ACTIVE",
      role_id: 21,
      created_on: new Date(),
      created_by: req.user?.id || null
    }, { transaction: t });

    /* ================= CREATE CLIENT ================= */
    const client = await Client.create({
      em_id,
      client_organisation,
      parent_entity,
      post_code,
      place: postal_address,
      register_address: address_list,
      vat_number,
      company_reg: company_reg_number,
      website,
      client_logo,
      subscription_type: subscription,
      monthly_cost,
      monthly_payroll,
      payroll_timesheet,
      no_payroll,
      upload: uploadFile,
      main_fullName: contact_name,
      main_position: contact_position,
      main_email: contact_email,
      lan_number: contact_number,
      lan_code: lane_code,
      mobile_number: contact_mobile,
      mobile_code,
      finance_name: finance_name || "",
      finance_position: finance_position || "",
      finance_no: finance_number || "",
      finance_mobile_code: finance_mobile_code || "",
      finance_mobile: finance_mobile || "",
      finance_email: finance_email || "",
      finance_entity_address: finance_entity_address || "",
      finance_cradit_limit: finance_credit_limit || 0,
      billing_name,
      billing_position,
      billing_number,
      billing_mobile_code,
      billing_mobile,
      billing_email,
      billing_entity_address,
      created_on: new Date(),
      created_by: req.user?.id || null
    }, { transaction: t });

    /* ================= STEP 2 DATA ================= */
    if (Array.isArray(step2_data)) {
      for (const item of step2_data) {
        const needs = Array.isArray(item.client_need)
          ? item.client_need.join(",")
          : item.client_need || "";

        const data = {
          client_id: client.id,
          post_code: item.post_code1,
          place: item.place,
          address: item.address,
          address_type: item.type,
          entity_name: item.entity_name,
          care_type: item.care_facility,
          client_need: needs,
          facility_contact_name: item.facility_contact_name || "",
          landline_code: item.facility_lane_code || "",
          mobile_code: item.facility_mobile_code || "",
          landline_no: item.facility_contact_landline_no || "",
          mobile_no: item.facility_contact_mobile_no || "",
          email: item.facility_contact_email || "",
          created_on: new Date(),
          created_by: req.user?.id,
          updated_on: new Date()
        };

        if (item.data_id) {
          await ClientRegistration.update(
            data,
            { where: { id: item.data_id, client_id: client.id }, transaction: t }
          );
        } else {
          await ClientRegistration.create(data, { transaction: t });
        }
      }
    }

    /* ================= SHIFT PATTERN ================= */
    if (Array.isArray(shift_pattern)) {
      for (const shift of shift_pattern) {
        const data = {
          sr: shift.sr_no,
          shift_pattern: shift.shift_pattern,
          shift_type: shift.shift_type,
          shift_start: shift.shift_start,
          shift_end: shift.shift_end,
          comments: shift.comments,
          updated_by: req.user?.id || null,
          updated_on: new Date(),
          created_by: req.user?.id,
          client_id: client.id,
          created_on: new Date()
        };

        if (shift.shiftid) {
          await shift_patterns.update(
            data,
            { where: { id: shift.shiftid }, transaction: t }
          );
        } else {
          await shift_patterns.create(data, { transaction: t });
        }
      }
    }

    /* ================= PAYRATE ================= */
    if (Array.isArray(payrate)) {
      for (const rate of payrate) {
        const data = {
          client_id: client.id,
          job_title: rate.job_title,
          regular_day_morning: rate.regular_day_morning || 0,
          regular_day_afternoon: rate.regular_day_afternoon || 0,
          regular_day_night: rate.regular_day_night || 0,
          regular_day_weekend_morning: rate.regular_day_weekend_morning || 0,
          regular_day_weekend_afternoon: rate.regular_day_weekend_afternoon || 0,
          regular_day_weekend_night: rate.regular_day_weekend_night || 0,
          regular_day_sleep_in: rate.regular_day_sleep_in || 0,
          regular_day_waking_night_weekday: rate.regular_day_waking_night_weekday || 0,
          regular_day_waking_night_weekend: rate.regular_day_waking_night_weekend || 0,
          bank_holiday_morning: rate.bank_holiday_morning || 0,
          bank_holiday_afternoon: rate.bank_holiday_afternoon || 0,
          bank_holiday_night: rate.bank_holiday_night || 0,
          bank_holiday_sleep_in: rate.bank_holiday_sleep_in || 0,
          bank_holiday_waking_night: rate.bank_holiday_waking_night || 0,
          status: 1,
          created_by: req.user?.id,
          created_on: new Date()
        };

        if (rate.id) {
          await Payrate.update(
            data,
            { where: { id: rate.id, client_id: client.id }, transaction: t }
          );
        } else {
          await Payrate.create(data, { transaction: t });
        }
      }
    }

    await t.commit();

    logger.info(`Client and employee registered successfully - Email: ${contact_email}, Client ID: ${client.id}`);
    return res.status(200).json({
      status: 200,
      success: true,
      message: "Client and Employee registered successfully!",
      employee,
      client_id: client.id
    });

  } catch (err) {
    await t.rollback();
    logger.error(`Error in client registration: ${err.message}`);
    return res.status(500).json({
      status: 500,
      success: false,
      message: err.message
    });
  }
};

const getParentEntity = async (req, res) => {
  try {
    logger.info("Fetching parent entities");
    const parentEntity = await Client.findAll({
      where: {
        status: "1",
      },
      attributes: ["client_organisation"]
    })

    logger.info(`Parent entities fetched successfully - Count: ${parentEntity?.length || 0}`);
    return res.status(200).json(new ApiResponse(200, parentEntity, "Parent Entity Fetched Successfully"));
  } catch (error) {
    logger.error(`Error fetching parent entities: ${error.message}`);
    return res.status(500).json(new ApiResponse(500, {}, error.message));
  }
}

const getAllClientInfo = async (req, res) => {
  try {

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Search
    const search = req.query.search ? req.query.search.trim() : null;

    logger.info(`Fetching all clients - Page: ${page}, Limit: ${limit}, Search: ${search || 'none'}`);

    // Base condition
    const whereCondition = {
      status: "1",
      deleted: { [Op.ne]: "Y" },
    };

    if (search) {
      whereCondition[Op.or] = [
        { client_organisation: { [Op.like]: `%${search}%` } },
        { post_code: { [Op.like]: `%${search}%` } },
        { register_address: { [Op.like]: `%${search}%` } },
        { main_fullName: { [Op.like]: `%${search}%` } },
        { mobile_number: { [Op.like]: `%${search}%` } },
      ];
    }

    // Fetch data with pagination
    const { rows: clients, count: total } = await Client.findAndCountAll({
      where: whereCondition,
      attributes: [
        "id",
        "client_organisation",
        "parent_entity",
        "post_code",
        "place",
        "register_address",
        "main_fullName",
        "mobile_number",
        "main_email",
      ],
      limit,
      offset,
      order: [["id", "DESC"]], // latest first
    });

    // If no clients found
    if (!clients.length) {
      logger.warn(`No clients found - Page: ${page}, Search: ${search || 'none'}`);
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "No client info found"));
    }

    // Return paginated result
    logger.info(`Fetched ${total} clients successfully - Page: ${page}`);
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          data: clients,
        },
        search ? `Search results for '${search}'` : "Clients fetched successfully"
      )
    );
  } catch (error) {
    logger.error(`Error fetching clients: ${error.message}`);
    return res.status(500).json(new ApiResponse(500, {}, error.message));
  }
};


const getClientInfoById = async (req, res) => {

  const { id } = req.query;

  try {
    logger.info(`Fetching client info - Client ID: ${id}`);
    const clients = await Client.findAll({
      where: {
        id: id,
        deleted: { [Op.ne]: "Y" }
      },
    })

    if (!clients.length) {
      logger.warn(`Get client info - Client not found - ID: ${id}`);
    } else {
      logger.info(`Client info fetched successfully - ID: ${id}`);
    }

    return res.status(200).json(new ApiResponse(200, clients, "clients Fetched Successfully"))
  } catch (error) {
    logger.error(`Error fetching client info: ${error.message}`);
    return res.status(500).json(new ApiResponse(500, {}, error.message));
  }
}
const getClientInfoByEmId = async (req, res) => {

  const { em_id } = req.query;

  try {
    logger.info(`Fetching client info by EM ID - EM ID: ${em_id}`);
    const clients = await Client.findAll({
      where: {
        em_id: em_id,
        deleted: { [Op.ne]: "Y" }
      },
    })

    if (!clients.length) {
      logger.warn(`Get client by EM ID - Client not found - EM ID: ${em_id}`);
    } else {
      logger.info(`Client fetched by EM ID successfully - EM ID: ${em_id}`);
    }

    return res.status(200).json(new ApiResponse(200, clients, "clients Fetched Successfully"))
  } catch (error) {
    logger.error(`Error fetching client by EM ID: ${error.message}`);
    return res.status(500).json(new ApiResponse(500, {}, error.message));
  }
}


const getAllServicesInfo = async (req, res) => {
  try {
    const { client_id } = req.query;
    logger.info(`Fetching all services info - Client ID: ${client_id}`);

    const allClientNeeds = await client_needs.findAll();

    const services = await ClientRegistration.findAll({
      where: {
        client_id: client_id,
        deleted: { [Op.ne]: "Y" }
      },
      include: [
        {
          model: careFacility,
          as: "careType",
          attributes: ["id", "facility_name"]
        },
      ]
    });

    if (!services.length) {
      logger.warn(`Get services - No services found - Client ID: ${client_id}`);
    } else {
      logger.info(`Services fetched successfully - Client ID: ${client_id}, Count: ${services.length}`);
    }

    const result = services.map(service => {
      const serviceJSON = service.toJSON();

      let clientNeedsArray = [];
      if (serviceJSON.client_need) {
        const ids = serviceJSON.client_need.split(',');
        clientNeedsArray = ids
          .map(id => {
            const need = allClientNeeds.find(n => n.id == id);
            return need ? { id, name: need.name } : null;
          })
          .filter(Boolean);
      }

      return {
        ...serviceJSON,
        care_type: serviceJSON.careType ? serviceJSON.careType.id : null,
        careType: serviceJSON.careType,
        clientNeeds: clientNeedsArray
      };
    });

    return res.status(200).json({
      status: 200,
      data: result,
      message: "Services Fetched Successfully"
    });

  } catch (error) {
    logger.error(`Error fetching services: ${error.message}`);
    return res.status(500).json({ status: 500, data: {}, message: error.message });
  }
};


const getShiftPattern = async (req, res) => {
  const { client_id } = req.query;

  try {
    logger.info(`Fetching shift pattern - Client ID: ${client_id}`);

    const getShifPatternData = await shift_patterns.findAll({
      where: {
        client_id: client_id
      }
    })

    if (!getShifPatternData.length) {
      logger.info(`Get shift pattern - No patterns found - Client ID: ${client_id}`);
    } else {
      logger.info(`Shift pattern fetched successfully - Client ID: ${client_id}, Count: ${getShifPatternData.length}`);
    }

    return res.status(200).json(new ApiResponse(200, getShifPatternData, "Shift Pattern Fetched Successfully"));
  } catch (error) {
    logger.error(`Error fetching shift pattern: ${error.message}`);
    return res.status(500).json({ status: 500, data: {}, message: error.message });
  }
}

const getPayRate = async (req, res) => {
  try {
    const { client_id } = req.query;
    logger.info(`Fetching pay rate - Client ID: ${client_id}`);

    const payRate = await Payrate.findAll({
      where: {
        client_id: client_id
      },
      include: [
        {
          model: job_title,
          as: "jobTitle",
          attributes: ["id", "name"]
        }
      ]
    })

    if (!payRate.length) {
      logger.info(`Get pay rate - No rates found - Client ID: ${client_id}`);
    } else {
      logger.info(`Pay rate fetched successfully - Client ID: ${client_id}, Count: ${payRate.length}`);
    }

    return res.status(200).json(new ApiResponse(200, payRate, "Pay Rate Fetched Successfully"));
  } catch (error) {
    logger.error(`Error fetching pay rate: ${error.message}`);
    return res.status(500).json(new ApiResponse(500, {}, error.message));
  }
}

const deleteFromList = async (req, res) => {
  try {
    const { id } = req.query;
    logger.info(`Deleting client - ID: ${id}`);

    const record = await Client.findByPk(id);

    if (!record) {
      logger.warn(`Delete client - Client not found - ID: ${id}`);
      return res.status(404).json(new ApiResponse(404, {}, "Record not found"));
    }

    record.deleted = 'Y';
    record.deleted_by = req.user?.id;
    record.deleted_on = new Date();

    await record.save();

    logger.info(`Client deleted successfully - ID: ${id}`);
    return res.status(200).json(new ApiResponse(200, record, " Client id deleted successfully"));

  } catch (error) {
    logger.error(`Error deleting client: ${error.message}`);
    return res.status(500).json(new ApiResponse(500, {}, error.message));
  }
}

const updateClientDetails = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { client_id } = req.query;
    const payload = req.body;

    logger.info(`Updating client details - Client ID: ${client_id}`);

    if (!client_id) {
      logger.warn("Update client - Missing client ID");
      return res.status(400).json(
        new ApiResponse(400, {}, "Client ID is required in query parameters.")
      );
    }

    if (Object.keys(payload).length === 0 && !req.uploadedFiles) {
      logger.warn(`Update client - Empty request body - Client ID: ${client_id}`);
      return res.status(400).json(
        new ApiResponse(400, {}, "Request body cannot be empty for an update.")
      );
    }

    const client = await Client.findByPk(client_id, { transaction: t });

    if (!client) {
      await t.rollback();
      logger.warn(`Update client - Client not found - ID: ${client_id}`);
      return res.status(404).json(
        new ApiResponse(404, {}, "Client not found")
      );
    }

    // NEVER allow email update
    if (payload.contact_email && payload.contact_email !== client.main_email) {
      logger.warn(`Update client - Email change attempt - Client ID: ${client_id}`);
      return res.status(400).json(
        new ApiResponse(400, {}, "Client email cannot be changed.")
      );
    }

    /* ================= FILES ================= */
    const newClientLogo = req.uploadedFiles?.client_logo || null;
    const newContractFile = req.uploadedFiles?.upload || null;

    /* ================= UI → DB MAP ================= */
    const clientKeyMap = {
      contact_name: 'main_fullName',
      contact_position: 'main_position',
      address_list: 'register_address',
      postal_address: 'place',
      client_organisation: 'client_organisation',
      parent_entity: 'parent_entity',
      post_code: 'post_code',
      vat_number: 'vat_number',
      company_reg_number: 'company_reg',
      website: 'website',
      subscription: 'subscription_type',
      monthly_cost: 'monthly_cost',
      monthly_payroll: 'monthly_payroll',
      payroll_timesheet: 'payroll_timesheet',
      no_payroll: 'no_payroll',
      mobile_number: 'mobile_number',
      mobile_code: 'mobile_code',
      lane_code: 'lan_code',
      contact_number: 'lan_number',
      finance_name: 'finance_name',
      finance_position: 'finance_position',
      finance_number: 'finance_no',
      finance_mobile_code: 'finance_mobile_code',
      finance_mobile: 'finance_mobile',
      finance_email: 'finance_email',
      finance_entity_address: 'finance_entity_address',
      finance_credit_limit: 'finance_cradit_limit',
      billing_name: 'billing_name',
      billing_position: 'billing_position',
      billing_number: 'billing_number',
      billing_mobile_code: 'billing_mobile_code',
      billing_mobile: 'billing_mobile',
      billing_email: 'billing_email',
      billing_entity_address: 'billing_entity_address',
    };

    Object.keys(clientKeyMap).forEach(key => {
      if (payload[key] !== undefined) {
        client[clientKeyMap[key]] = payload[key];
      }
    });

    // update logo only if uploaded
    if (newClientLogo) {
      client.client_logo = newClientLogo;
    }

    // update contract only if uploaded
    if (newContractFile) {
      client.upload = newContractFile;
    }

    client.updated_by = req.user?.id || null;
    client.updated_on = new Date();
    await client.save({ transaction: t });

    /* ================= EMPLOYEE UPDATE ================= */
    const employee = await Employee.findOne({
      where: { em_email: client.main_email },
      transaction: t
    });

    if (!employee) {
      await t.rollback();
      logger.warn(`Update client - Employee not found - Email: ${client.main_email}`);
      return res.status(404).json(
        new ApiResponse(404, {}, "Mapped employee not found")
      );
    }

    let firstName = employee.first_name;
    let lastName = employee.last_name;

    if (payload.contact_name) {
      const parts = payload.contact_name.trim().split(" ");
      firstName = parts[0];
      lastName = parts.slice(1).join(" ");
    }

    await employee.update({
      first_name: firstName,
      last_name: lastName,
      em_address: payload.address_list || employee.em_address,
      em_mobile_number: payload.mobile_number || employee.em_mobile_number,
      em_mobile_code: payload.mobile_code || employee.em_mobile_code,
      em_image: newClientLogo || employee.em_image,
      updated_by: req.user?.id || null,
      updated_on: new Date(),
    }, { transaction: t });

    await t.commit();
    logger.info(`Client and employee updated successfully - Client ID: ${client_id}`);
    return res.status(200).json(
      new ApiResponse(200, client, "Client & Employee updated successfully")
    );

  } catch (err) {
    await t.rollback();
    logger.error(`Error updating client details: ${err.message}`);
    return res.status(500).json(
      new ApiResponse(500, {}, err.message)
    );
  }
};

const updateClientService = async (req, res) => {
  try {
    const { client_id } = req.query;
    const { service_entries } = req.body;

    logger.info(`Updating client services - Client ID: ${client_id}, Entries: ${service_entries?.length || 0}`);

    if (!client_id) {
      logger.warn("Update client service - Missing client ID");
      return res.status(400).json(new ApiResponse(400, {}, "Client ID is required."));
    }

    if (!Array.isArray(service_entries) || service_entries.length === 0) {
      logger.warn(`Update client service - Empty service entries - Client ID: ${client_id}`);
      return res.status(400).json(new ApiResponse(400, {}, "Service entries array is required."));
    }

    const client = await Client.findByPk(client_id);
    if (!client) {
      logger.warn(`Update client service - Client not found - ID: ${client_id}`);
      return res.status(404).json(new ApiResponse(404, {}, "Client not found."));
    }

    const updated = [];

    for (const entry of service_entries) {
      if (!entry.id) {
        logger.warn(`Update client service - Missing entry ID - Client ID: ${client_id}`);
        return res.status(400).json(new ApiResponse(400, {}, "Each service entry must include an 'id' to update."));
      }

      const existing = await ClientRegistration.findOne({
        where: {
          id: entry.id,
          client_id,
          deleted: "N"
        }
      });

      if (!existing) {
        logger.warn(`Update client service - Entry not found - ID: ${entry.id}`);
        return res.status(404).json(new ApiResponse(404, {}, `Service entry with ID ${entry.id} not found.`));
      }

      const clientNeed = Array.isArray(entry.client_need)
        ? entry.client_need.join(",")
        : entry.client_need || "";

      const data = {
        post_code: entry.post_code,
        place: entry.place,
        address: entry.address,
        address_type: entry.type,
        entity_name: entry.entity_name,
        care_type: entry.care_facility,
        client_need: clientNeed,
        facility_contact_name: entry.facility_contact_name || "",
        landline_code: entry.facility_lane_code || "",
        landline_no: entry.facility_contact_landline_no || "",
        mobile_code: entry.facility_mobile_code || "",
        mobile_no: entry.facility_contact_mobile_no || "",
        email: entry.facility_contact_email || "",
        updated_by: req.user?.id || null,
        updated_on: new Date()
      };

      await ClientRegistration.update(data, {
        where: { id: entry.id }
      });

      updated.push({ id: entry.id, status: "updated" });
    }

    logger.info(`Client services updated successfully - Client ID: ${client_id}, Updated count: ${updated.length}`);
    return res.status(200).json(new ApiResponse(200, updated, "Client service entries updated successfully."));

  } catch (err) {
    logger.error(`Error updating client services: ${err.message}`);
    return res.status(500).json(new ApiResponse(500, {}, err.message));
  }
};

const updateClientShiftPattern = async (req, res) => {
  try {
    const { client_id, shift_pattern_entries } = req.body;

    logger.info(`Updating shift patterns - Client ID: ${client_id}, Entries: ${shift_pattern_entries?.length || 0}`);

    if (!client_id) {
      logger.warn("Update shift pattern - Missing client ID");
      return res.status(400).json(new ApiResponse(400, {}, "Client ID is required."));
    }

    if (!Array.isArray(shift_pattern_entries) || shift_pattern_entries.length === 0) {
      logger.warn(`Update shift pattern - Empty entries - Client ID: ${client_id}`);
      return res.status(400).json(new ApiResponse(400, {}, "Shift pattern entries array is required."));
    }

    const client = await Client.findByPk(client_id);
    if (!client) {
      logger.warn(`Update shift pattern - Client not found - ID: ${client_id}`);
      return res.status(404).json(new ApiResponse(404, {}, "Client not found."));
    }

    let updated = [];

    for (const entry of shift_pattern_entries) {
      if (entry.sr === undefined || entry.sr === null || entry.sr === "") {
        logger.warn(`Update shift pattern - Missing sr value - Client ID: ${client_id}`);
        return res.status(400).json(new ApiResponse(400, {}, "Each shift pattern entry must include a non-empty 'sr' value."));
      }
      if (entry.id) {
        const existing = await shift_patterns.findOne({
          where: {
            id: entry.id,
            client_id,
            deleted: "N"
          },
          logging: true
        });

        if (!existing) {
          logger.warn(`Update shift pattern - Entry not found - ID: ${entry.id}`);
          return res.status(404).json(new ApiResponse(404, {}, `Shift pattern entry with ID ${entry.id} not found.`));
        }

        const data = {
          sr: entry.sr,
          shift_pattern: entry.shift_pattern,
          shift_type: entry.shift_type,
          shift_start: entry.shift_start,
          shift_end: entry.shift_end,
          remarks: entry.remarks || "",
          updated_by: req.user?.id || null,
          updated_on: new Date()
        };

        const newUpdate = await shift_patterns.update(data, {
          where: {
            id: entry.id,
            client_id: client_id
          },
          logging: true
        });

        updated.push({ id: entry.id, status: "updated" });
      } else {
        const data = {
          sr: entry.sr,
          shift_pattern: entry.shift_pattern,
          shift_type: entry.shift_type,
          shift_start: entry.shift_start,
          shift_end: entry.shift_end,
          comments: entry.comments || "",
          client_id: client_id,
          created_by: req.user?.id || null,
          created_on: new Date()
        };

        const created = await shift_patterns.create(data, { logging: true });
        updated.push({ id: created.id, status: "created" });
      }
    }

    logger.info(`Shift patterns updated successfully - Client ID: ${client_id}, Updated count: ${updated.length}`);
    return res.status(200).json(new ApiResponse(200, updated, "Shift pattern entries updated successfully."));

  } catch (err) {
    logger.error(`Error updating shift patterns: ${err.message}`);
    return res.status(500).json(new ApiResponse(500, {}, err.message));
  }
};


const updateClientPayRate = async (req, res) => {
  try {
    const { client_id } = req.query;
    const { payrate_entries } = req.body;

    logger.info(`Updating pay rates - Client ID: ${client_id}, Entries: ${payrate_entries?.length || 0}`);

    if (!client_id) {
      logger.warn("Update pay rate - Missing client ID");
      return res.status(400).json(new ApiResponse(400, {}, "Client ID is required in query parameters."));
    }

    if (!Array.isArray(payrate_entries) || payrate_entries.length === 0) {
      logger.warn(`Update pay rate - Empty entries - Client ID: ${client_id}`);
      return res.status(400).json(new ApiResponse(400, {}, "payrate_entries must be a non-empty array."));
    }

    let result = [];

    for (const entry of payrate_entries) {
      const { id: payrate_id, job_title, ...payload } = entry;

      if (!job_title || job_title === "") {
        logger.warn(`Update pay rate - Missing job title - Client ID: ${client_id}`);
        return res.status(400).json(new ApiResponse(400, {}, "Each entry must include a non-empty job title."));
      }

      if (Object.keys(payload).length === 0) {
        logger.warn(`Update pay rate - Empty payload - Job Title: ${job_title}`);
        return res.status(400).json(new ApiResponse(400, {}, "Each entry must include fields to update or create."));
      }

      if (!payrate_id) {
        const existing = await Payrate.findOne({
          where: {
            client_id,
            job_title,
            deleted: "N",
          },
        }
        );

        if (existing) {
          logger.warn(`Update pay rate - Duplicate job title - Job Title: ${job_title}, Client ID: ${client_id}`);
          return res.status(400).json(
            new ApiResponse(400, {}, `Pay rate for job title '${job_title}' already exists for this client.`));
        }

        const createData = {
          client_id,
          job_title,
          ...payload,
          created_by: req.user?.id || "",
          created_on: new Date()
        };

        const createdRecord = await Payrate.create(createData);
        logger.info(`Pay rate created - ID: ${createdRecord?.id}, Job Title: ${job_title}`);
        result.push({ id: createdRecord.id, status: "created" });
      }
      else {
        const payrateRecord = await Payrate.findOne({
          where: {
            id: payrate_id,
            client_id,
            job_title,
            deleted: "N",
          },
        });

        if (!payrateRecord) {
          logger.warn(`Update pay rate - Record not found - ID: ${payrate_id}, Job Title: ${job_title}`);
          return res.status(404).json(new ApiResponse(404, {}, `Pay Rate record not found for ID ${payrate_id}, Client ID ${client_id}, and Job Title '${job_title}'.`));
        }

        const isDeleted = payload?.deleted || "N";
        if (isDeleted === "Y") {
          const updateFields = {
            deleted: "Y",
            deleted_by: req.user?.id || "",
            deleted_on: new Date(),
          };

          Object.assign(payrateRecord, updateFields);

          const deletedRecord = await payrateRecord.save();
          logger.info(`Pay rate deleted - ID: ${deletedRecord?.id}, Job Title: ${job_title}`);
          result.push({ id: deletedRecord.id, status: "deleted" });
        } else {
          const updateFields = {
            ...payload,
            updated_by: req.user?.id || "",
            updated_on: new Date(),
          };

          Object.assign(payrateRecord, updateFields);

          const updatedRecord = await payrateRecord.save();
          logger.info(`Pay rate updated - ID: ${updatedRecord?.id}, Job Title: ${job_title}`);
          result.push({ id: updatedRecord.id, status: "updated" });
        }
      }
    }

    logger.info(`Pay rates processed successfully - Client ID: ${client_id}, Result count: ${result.length}`);
    return res.status(200).json(new ApiResponse(200, result, "Pay rate entries processed successfully."));
  } catch (err) {
    logger.error(`Error processing pay rates: ${err.message}`);
    return res.status(500).json(new ApiResponse(500, {}, err.message));
  }
};



export {
  registerClient,
  getParentEntity,
  getAllClientInfo,
  deleteFromList,
  updateClientDetails,
  getClientInfoById,
  getShiftPattern,
  getAllServicesInfo,
  updateClientService,
  updateClientShiftPattern,
  updateClientPayRate,
  getClientInfoByEmId,
  getPayRate
};