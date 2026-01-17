import { Roles } from "../model/role.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Employee } from '../model/employee.model.js';

const employees = await Employee.findAll({
    attributes: ["role_id"]
});

const createRoles = async (req, res) => {

    const { roleName } = req.body;
    try {

        const checkRoleExisted = await Roles.findOne({
            where: { rolename: roleName }
        })

        if (checkRoleExisted) {
            return res.status(500).json(new ApiResponse(500, {}, 'role already existed'))
        }

        const role = await Roles.create({
            rolename: roleName,
            status: "1",
            insert_by: req.user?.id || null,
            insert_on: new Date()
        })

        return res.status(200).json(new ApiResponse(200, role, 'role created successfully'))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiResponse(500, {}, error?.message))
    }
}

const updateRoles = async (req, res) => {

    const { id } = req.query;
    const { roleName } = req.body;

    try {
        const role = await Roles.findByPk(id);
        if (!role) {
            return res
                .status(404)
                .json(new ApiResponse(404, {}, "Role not found"));
        }

        for (let emp of employees) {
            if (Number(id) === Number(emp.dataValues.role_id)) {
                return res.status(400).json(new ApiResponse(400, null, "You cannot update this role"));
            }
        }

        role.rolename = roleName;
        role.updated_on = new Date();
        role.updated_by = req.user?.id || null;
        await role.save();

        return res
            .status(200)
            .json(new ApiResponse(200, role, "Role updated successfully"));

    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json(new ApiResponse(500, {}, error.message || "Internal server error while updating roles"));
    }
}


const getRole = async (req, res) => {
    try {
        const roles = await Roles.findAll();

        if (roles.length === 0) {
            return res.status(400).json({ message: "No roles found" });
        }

        return res.status(200).json({ message: "Roles fetched successfully", roles });

    } catch (error) {
        return res.status(500).json({
            message: "error while getting roles from database"
        })
    }
}

const deleteRole = async (req, res) => {

    const { id } = req.query;

    try {
        const role = await Roles.findByPk(id);

        if (!role) {
            return res.status(404).json(new ApiResponse(404, {}, "Role not found"));
        }

        for (let emp of employees) {
            if (Number(id) === Number(emp.dataValues.role_id)) {
                return res.status(400).json(new ApiResponse(400, null, "You cannot delete this role"));
            }
        }

        role.deleted_by = req.user?.id || null;
        role.deleted_on = new Date();
        role.is_deleted = "Y";
        await role.save();

        return res.status(200).json(new ApiResponse(200, role, "Role deleted successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new ApiResponse(500, {}, error.message || "Internal server error while deleting role"));
    }
}


export {
    createRoles,
    updateRoles,
    getRole,
    deleteRole
}