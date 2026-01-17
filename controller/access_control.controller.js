import { Permission } from "../model/access_control.model.js";
import { Roles } from "../model/role.model.js";
import { Menu } from "../model/menu.model.js";
import { Op } from "sequelize";

const createPermission = async (req, res) => {
  try {
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
      await existing.update({
      readp,
      writep,
      updatep,
      deletep,
      start_time,
      end_time,
      })
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


    // console.log("permission created", permission)

    return res
      .status(201)
      .json({ message: "Permission created successfully", permission });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error while creating permission", error: error.message });
  }
};


const getPermissionById = async (req, res) => {
  try {
    const { roleId } = req.query;

    // console.log(roleId);

    const permission = await Permission.findAll({
    where: { role_id: roleId },
    include: [
        { model: Roles, as: "Role", attributes: ["id", "rolename"] },
        { model: Menu, as: "Menu", attributes: ["id", "menu_name"] },
    ],
    // logging: console.log,
    });


    // console.log("Getting permission from permission", permission)

    if (!permission) {
      return res.status(404).json({ message: "Permission not found" });
    }

    return res.status(200).json({ permission });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error while fetching permission", error: error.message });
  }
};


const getSidebarMenuByRole = async (req, res) => {
    const { roleId } = req.query;
    if (!roleId) {
        return res.status(400).json({ success: false, message: "Role ID is required" });
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

        return res.status(200).json({
            success: true,
            message: "Menu list fetched successfully",
            data: menuList,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error while getting menu list",
            error: error.message,
        });
    }
};


const getAllMenuPermissions = async (req, res) => {
    try {
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
        return res.status(200).json({ success: true, data: formattedMenu });

    } catch (error) {
        console.log("Error while fetching menu permissions:", error);
        return res.status(500).json({ message: "Error while getting permission list with menu", error: error.message });
    }
};


export {
    createPermission,
    getPermissionById,
    getSidebarMenuByRole,
    getAllMenuPermissions
}

