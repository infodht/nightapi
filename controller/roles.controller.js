import { Roles } from "../model/role.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Employee } from '../model/employee.model.js';
import logger from '../logger/logger.js';

const employees = await Employee.findAll({
    attributes: ["role_id"]
});

const createRoles = async (req, res) => {

    const { roleName } = req.body;
    try {
        logger.info(`Creating role: ${roleName}`);

        const checkRoleExisted = await Roles.findOne({
            where: { rolename: roleName }
        })

        if (checkRoleExisted) {
            logger.warn(`Role already exists: ${roleName}`);
            return res.status(500).json(new ApiResponse(500, {}, 'role already existed'))
        }

        const role = await Roles.create({
            rolename: roleName,
            status: "1",
            insert_by: req.user?.id || null,
            insert_on: new Date()
        })

        logger.info(`Role created successfully: ${roleName} (ID: ${role.id})`);
        return res.status(200).json(new ApiResponse(200, role, 'role created successfully'))
    } catch (error) {
        logger.error(`Error creating role: ${error?.message}`);
        return res.status(500).json(new ApiResponse(500, {}, error?.message))
    }
}

const updateRoles = async (req, res) => {

    const { id } = req.query;
    const { roleName } = req.body;

    try {
        logger.info(`Updating role ID: ${id} to name: ${roleName}`);
        const role = await Roles.findByPk(id);
        if (!role) {
            logger.warn(`Role not found for update - ID: ${id}`);
            return res
                .status(404)
                .json(new ApiResponse(404, {}, "Role not found"));
        }

        for (let emp of employees) {
            if (Number(id) === Number(emp.dataValues.role_id)) {
                logger.warn(`Cannot update role - employees assigned to role ID: ${id}`);
                return res.status(400).json(new ApiResponse(400, null, "You cannot update this role"));
            }
        }

        role.rolename = roleName;
        role.updated_on = new Date();
        role.updated_by = req.user?.id || null;
        await role.save();

        logger.info(`Role updated successfully - ID: ${id}`);
        return res
            .status(200)
            .json(new ApiResponse(200, role, "Role updated successfully"));

    } catch (error) {
        logger.error(`Error updating role ID ${id}: ${error.message}`);
        return res
            .status(500)
            .json(new ApiResponse(500, {}, error.message || "Internal server error while updating roles"));
    }
}


const getRole = async (req, res) => {
    try {
        logger.info('Fetching all roles');
        const roles = await Roles.findAll();

        if (roles.length === 0) {
            logger.warn('No roles found in database');
            return res.status(400).json({ message: "No roles found" });
        }

        logger.info(`Retrieved ${roles.length} roles`);
        return res.status(200).json({ message: "Roles fetched successfully", roles });

    } catch (error) {
        logger.error(`Error fetching roles: ${error.message}`);
        return res.status(500).json({
            message: "error while getting roles from database"
        })
    }
}

const deleteRole = async (req, res) => {

    const { id } = req.query;

    try {
        logger.info(`Deleting role ID: ${id}`);
        const role = await Roles.findByPk(id);

        if (!role) {
            logger.warn(`Role not found for deletion - ID: ${id}`);
            return res.status(404).json(new ApiResponse(404, {}, "Role not found"));
        }

        for (let emp of employees) {
            if (Number(id) === Number(emp.dataValues.role_id)) {
                logger.warn(`Cannot delete role - employees assigned to role ID: ${id}`);
                return res.status(400).json(new ApiResponse(400, null, "You cannot delete this role"));
            }
        }

        role.deleted_by = req.user?.id || null;
        role.deleted_on = new Date();
        role.is_deleted = "Y";
        await role.save();

        logger.info(`Role deleted successfully - ID: ${id}`);
        return res.status(200).json(new ApiResponse(200, role, "Role deleted successfully"));
    } catch (error) {
        logger.error(`Error deleting role ID ${id}: ${error.message}`);
        return res.status(500).json(new ApiResponse(500, {}, error.message || "Internal server error while deleting role"));
    }
}


export {
    createRoles,
    updateRoles,
    getRole,
    deleteRole
}