import crypto from "crypto";
import { Employee } from "../model/employee.model.js";
import { Sequelize } from "sequelize";
import logger from "../logger/logger.js";

// Generate Prefix Based on Role
const getPrefixFromRole = (role) => {
  switch (role) {
    case "CANDIDATE": return "CND";
    case "CLIENT": return "CLT";
    case "EMPLOYEE": return "EMP";
    case "SUPER ADMIN": return "EMP"; // Can change later if needed
    case "ADMIN": return "EMP";
    default: return "EMP";
  }
};

// Function to generate next ID
const generateNextId = async (prefix) => {
  const latestRecord = await Employee.findOne({
    where: {
      em_id: {
        [Sequelize.Op.like]: `${prefix}%`
      }
    },
    order: [["id", "DESC"]],
  });

  if (!latestRecord) {
    return `${prefix}0001`;
  }

  // Extract numeric part
  const currentNumber = parseInt(latestRecord.em_id.replace(prefix, ""), 10);

  const nextNumber = currentNumber + 1;

  // Automatically supports 5, 6, 7 digits as it grows
  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};

// Create SHA1 hash for passwords
const createSha1Hash = (value) => {
  return crypto
    .createHash("sha1")
    .update(value)
    .digest("hex");
};

const createEmployee = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      em_email,
      username,
      em_password,
      em_role,
      em_address,
      em_mobile_number,
      em_mobile_code,
      em_birthday,
      em_joining_date,
      em_image,
      em_gender,
      is_reporting,
      status,
      supervisor_id,
      role_id,
      created_by
    } = req.body;

    logger.info(`Creating employee with email: ${em_email}, role: ${em_role}`);

    // Check if email exists
    const emailExists = await Employee.findOne({
      where: { em_email }
    });

    if (emailExists) {
      logger.warn(`Employee already exists with email: ${em_email}`);
      return res.status(400).json({
        success: false,
        message: "This email is already registered. Please use a different email.",
      });
    }

    // Generate Prefix ID
    const prefix = getPrefixFromRole(em_role);
    const em_id = await generateNextId(prefix);

    // Hash Password using the function
    const hashedPassword = createSha1Hash(em_password);

    // Create Employee
    const newEmployee = await Employee.create({
      em_id,
      first_name,
      last_name,
      em_email,
      username,
      em_password: hashedPassword,
      em_role,
      em_address,
      em_mobile_number,
      em_mobile_code,
      em_birthday,
      em_joining_date: new Date(),
      em_image,
      em_gender,
      is_reporting,
      status,
      supervisor_id,
      role_id,
      created_on: new Date(),
      created_by,
      updated_on: null,
      updated_by: null
    });

    logger.info(`Employee created successfully - ID: ${em_id}, Email: ${em_email}`);
    return res.status(200).json({
      success: true,
      message: "Employee created successfully!",
      data: newEmployee,
    });

  } catch (err) {
    logger.error(`Error creating employee with email ${em_email}: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: "Error while creating employee",
      error: err.message
    });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    logger.info(`Updating employee ID: ${id}`);

    // Check if employee exists
    const employee = await Employee.findByPk(id);
    if (!employee) {
      logger.warn(`Employee not found for update - ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // BLOCK FIELDS THAT SHOULD NEVER CHANGE
    const blockedFields = ["em_id", "em_email", "username", "em_role", "role_id", "em_password"];

    for (const field of blockedFields) {
      if (payload[field]) {
        logger.warn(`Blocked field update attempt for field: ${field}, ID: ${id}`);
        return res.status(400).json({
          success: false,
          message: `You cannot update the field: ${field}`,
        });
      }
    }

    // Allowed fields only (you can add/remove easily)
    const allowedFields = [
      "first_name",
      "last_name",
      "em_address",
      "em_mobile_number",
      "em_mobile_code",
      "em_image",
      "em_gender",
      "is_reporting",
      "status",
      "supervisor_id"
    ];

    // Prepare the update object
    const updateData = {};
    allowedFields.forEach(field => {
      if (payload[field] !== undefined) {
        updateData[field] = payload[field];
      }
    });

    // Add audit fields
    updateData.updated_by = req.user?.id || null;
    updateData.updated_on = new Date();

    // Save to database
    await employee.update(updateData);

    logger.info(`Employee updated successfully - ID: ${id}`);
    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });

  } catch (err) {
    logger.error(`Error updating employee ID ${id}: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: "Error updating employee",
      error: err.message,
    });
  }
};

const changeEmployeePassword = async (req, res) => {
  try {
    const { email } = req.query;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    logger.info(`Password change requested for email: ${email}`);

    // Basic validation
    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      logger.warn(`Password change - missing required fields for email: ${email}`);
      return res.status(400).json({
        success: false,
        message: "Email and all password fields are required",
      });
    }

    // Find employee
    const employee = await Employee.findOne({ where: { em_email: email } });

    if (!employee) {
      logger.warn(`Password change - employee not found for email: ${email}`);
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Verify current password
    if (createSha1Hash(currentPassword) !== employee.em_password) {
      logger.warn(`Password change - incorrect current password for email: ${email}`);
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // New password validations
    if (newPassword !== confirmPassword) {
      logger.warn(`Password change - new & confirm password mismatch for email: ${email}`);
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    if (currentPassword === newPassword) {
      logger.warn(`Password change - new password same as old password for email: ${email}`);
      return res.status(400).json({
        success: false,
        message: "New password must be different",
      });
    }

    // Update password
    await employee.update({
      em_password: createSha1Hash(newPassword),
      updated_on: new Date(),
      updated_by: req.user?.id || null,
    });

    logger.info(`Password changed successfully for email: ${email}`);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (err) {
    logger.error(`Error changing password for employee: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: "Error while changing password",
      error: err.message,
    });
  }
};

export {
  createEmployee,
  updateEmployee,
  getPrefixFromRole,
  generateNextId,
  createSha1Hash,
  changeEmployeePassword
}
