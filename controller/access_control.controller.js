import { Permission } from "../model/access_control.model.js";
import { Roles } from "../model/role.model.js";
import { Menu } from "../model/menu.model.js";
import { Op } from "sequelize";
import logger from "../logger/logger.js";
import * as cache from "../services/cache/cache.service.js";

const createPermission = async (req, res) => {
  try {
    logger.info(`Creating permission for role_id: ${req.body.role_id}, menu_id: ${req.body.menu_id}`);
    const {
      menu_id,
      role_id,
      readp,
      writep,
      updatep,
      deletep,
      start_time,
      end_time,
    } = req.body;

    // console.log("request body when create permissions:-",req.body)

    const existing = await Permission.findOne({
      where: { role_id, menu_id },
    });

    // console.log("existing permission",existing)
    if (existing) {
      logger.info(`Permission already exists, updating for role_id: ${role_id}, menu_id: ${menu_id}`);
      await existing.update({
      readp,
      writep,
      updatep,
      deletep,
      start_time,
      end_time,
      })
      await cache.delPattern("access:permissions:*");
      await cache.delPattern("access:sidebar:*");
      logger.info(`Permission updated successfully for role_id: ${role_id}, menu_id: ${menu_id}`);
      return res
      .status(201)
      .json({ message: "Permission updated successfully", existing });
    }

    const permission = await Permission.create({
      menu_id,
      role_id,
      readp,
      writep,
      updatep,
      deletep,
      start_time,
      end_time,
    });

    await cache.delPattern("access:permissions:*");
    await cache.delPattern("access:sidebar:*");

    logger.info(`Permission created successfully - role_id: ${role_id}, menu_id: ${menu_id}`);
    return res
      .status(201)
      .json({ message: "Permission created successfully", permission });
  } catch (error) {
    logger.error(`Error creating permission: ${error.message}`);
    return res
      .status(500)
      .json({ message: "Error while creating permission", error: error.message });
  }
};


const getPermissionById = async (req, res) => {
  try {
    const { roleId } = req.query;
    logger.info(`Fetching permissions for roleId: ${roleId}`);

    const cacheKey = `access:permissions:${roleId}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      logger.info(`Returning cached permissions for roleId: ${roleId}`);
      return res.status(200).json(cachedData);
    }

    const permission = await Permission.findAll({
    where: { role_id: roleId },
    include: [
        { model: Roles, as: "Role", attributes: ["id", "rolename"] },
        { model: Menu, as: "Menu", attributes: ["id", "menu_name"] },
    ],
    });

    if (!permission) {
      logger.warn(`Permission not found for roleId: ${roleId}`);
      return res.status(404).json({ message: "Permission not found" });
    }

    logger.info(`Retrieved ${permission.length} permissions for roleId: ${roleId}`);
    const response = { permission };
    await cache.set(cacheKey, response, 1800);
    return res.status(200).json(response);
  } catch (error) {
    logger.error(`Error fetching permissions for roleId: ${error.message}`);
    return res
      .status(500)
      .json({ message: "Error while fetching permission", error: error.message });
  }
};


const getSidebarMenuByRole = async (req, res) => {
    const { roleId } = req.query;
    if (!roleId) {
        logger.warn('Sidebar menu request without roleId');
        return res.status(400).json({ success: false, message: "Role ID is required" });
    }

    logger.info(`Fetching sidebar menu for roleId: ${roleId}`);
    
    const cacheKey = `access:sidebar:${roleId}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      logger.info(`Returning cached sidebar menu for roleId: ${roleId}`);
      return res.status(200).json(cachedData);
    }
    
    try {
        const permissions = await Permission.findAll({
            where: {
                role_id: roleId,
                [Op.or]: [
                    { readp: 1 },
                    { writep: 1 },
                    { updatep: 1 },
                    { deletep: 1 },
                ],
            },
            include: [
                {
                    model: Menu,
                    as: "Menu",
                    attributes: ["id", "menu_name", "parent_id", "url", "icon", "menu_sequence", "active"],
                    include: [
                        {
                            model: Menu,
                            as: "parentMenu",
                            attributes: ["id", "menu_name"],
                        },
                    ],
                },
            ],
            // logging: console.log,
        });

        if (!permissions.length) {
            logger.warn(`No permissions found for roleId: ${roleId}`);
            return res.status(404).json({ success: false, message: "No permissions found for this role." });
        }

        const menuList = permissions
            .filter(p => p.Menu)
            .map(p => ({
                id: p.Menu.id,
                menu_name: p.Menu.menu_name,
                url: p.Menu.url,
                icon: p.Menu.icon,
                menu_sequence: p.Menu.menu_sequence,
                parent_id: p.Menu.parent_id,
                active: p.Menu.active,
                parentMenu: p.Menu.parentMenu
                    ? { id: p.Menu.parentMenu.id, menu_name: p.Menu.parentMenu.menu_name }
                    : null,
            }));

        logger.info(`Sidebar menu fetched successfully for roleId: ${roleId}`);
        const response = {
            success: true,
            message: "Menu list fetched successfully",
            data: menuList,
        };
        await cache.set(cacheKey, response, 1800);
        return res.status(200).json(response);

    } catch (error) {
        logger.error(`Error getting sidebar menu for roleId ${roleId}: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Error while getting menu list",
            error: error.message,
        });
    }
};


const getAllMenuPermissions = async (req, res) => {
    try {
        logger.info('Fetching all menu permissions');
        
        const cacheKey = "access:permissions:all:menus";
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
            logger.info("Returning cached menu permissions");
            return res.status(200).json(cachedData);
        }
        
        const menuPermissions = await Menu.findAll({
            include: [
                {
                    model: Menu,
                    as: "parentMenu",
                    attributes: ["menu_name","id"]
                },
                {
                    model: Permission,
                    as: "Permissions",
                    attributes: ["role_id", "readp", "writep", "updatep", "deletep"],
                    include: [
                        { 
                            model: Roles, 
                            as: "Role", 
                            attributes: ["rolename","id"] 
                        }
                    ]
                },
            ],
            attributes: ["id", "menu_name","parent_id", "url", "icon", "active"]
        });

        const formattedMenu = menuPermissions.map(menu => {
            const uniquePermissionsMap = new Map();
            for (const permission of menu.Permissions || []) {
                const key = `${permission.role_id}-${permission.Role?.rolename.trim()}`;
                if (!uniquePermissionsMap.has(key)) {
                    uniquePermissionsMap.set(key, {
                        role_id: permission.role_id,
                        roleName: permission.Role ? permission.Role.rolename.trim() : null,
                        readp: permission.readp,
                        writep: permission.writep,
                        updatep: permission.updatep,
                        deletep: permission.deletep
                    });
                }
            }

            return {
                id: menu.id,
                menuName: menu.menu_name,
                parentName: menu.parentMenu ? menu.parentMenu.menu_name : null,
                url: menu.url,
                icon: menu.icon,
                active: menu.active,
                permissions: Array.from(uniquePermissionsMap.values()),
            };
        });


        // console.log("formattedMenu",formattedMenu)
        logger.info(`Retrieved ${menuPermissions.length} menus with permissions`);
        const response = { success: true, data: formattedMenu };
        await cache.set(cacheKey, response, 3600);
        return res.status(200).json(response);

    } catch (error) {
        logger.error(`Error fetching menu permissions: ${error.message}`);
        return res.status(500).json({ message: "Error while getting permission list with menu", error: error.message });
    }
};


export {
    createPermission,
    getPermissionById,
    getSidebarMenuByRole,
    getAllMenuPermissions
}

