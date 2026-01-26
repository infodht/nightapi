import { Menu } from '../model/menu.model.js';
import logger from '../logger/logger.js';

const createMenu = async (req, res) => {
    try {
        const { menuName, url, icon, parent_id, active, sequence } = req.body;
        logger.info(`Creating menu: ${menuName}`);

        if (!menuName || !url) {
             logger.warn('Menu creation - missing menuName or url');
             return res.status(400).json({ message: "All fields are required" });
        }

        const existingMenu = await Menu.findOne({ where: { menu_name: menuName } });

        if (existingMenu) {
            logger.warn(`Menu already exists: ${menuName}`);
            return res.status(400).json({ message: "Menu already exists" });
        }

        let parentMenu = null;
        if (parent_id) {
        parentMenu = await Menu.findByPk(parent_id);
        if (!parentMenu) {
            logger.warn(`Parent menu not found for parent_id: ${parent_id}`);
            return res
            .status(400)
            .json({message: 'Parent menu does not exist'});
        }
        }

        const menu = await Menu.create({ 
            menu_name: menuName, 
            url, 
            icon, 
            parent_id: parent_id || null, 
            active, 
            sequence
         });

         logger.info(`Menu created successfully: ${menuName} (ID: ${menu.id})`);
         return res.status(201).json({ message: "Menu created successfully", menu });
    } catch (error) {
        logger.error(`Error creating menu: ${error.message}`);
         return res.status(500).json({message: "Error while getting menu list", error});
    }
};
 

const getMenuList = async(req, res) => {
    try {
        logger.info('Fetching all menus');
        
        const menu = await Menu.findAll({
        order: [['menu_sequence', 'ASC']], 
        include: [
            {
            model: Menu,
            as: 'parentMenu',
            attributes: ['id', 'menu_name'] 
            }
        ]
        });

        logger.info(`Retrieved ${menu.length} menus`);
        return res.status(200).json({message: "Menu list fetched successfully", menu});

        
    } catch (error) {
       logger.error(`Error fetching menus: ${error.message}`);
       return res.status(500).json({message: "Error while getting menu list", error});
    }
}

const updateMenu = async(req, res) => {
    const {id} = req.params;
    const updateFields = req.body;

    try {
        logger.info(`Updating menu ID: ${id}`);

        const menu = await Menu.findByPk(id);
        if(!menu) {
            logger.warn(`Menu not found for update - ID: ${id}`);
            return res.status(404).json({message: "Menu not found"});
        }

        const updates = {};

        Object.keys(updateFields).forEach(key => {
            if (updateFields[key] !== null) {
                updates[key] = updateFields[key];
            }
        });

        if (Object.keys(updateFields).length === 0) {
            logger.warn(`No valid fields provided for menu update - ID: ${id}`);
            return res.status(400).json({ message: "No valid fields provided for update" });
        }

        const update = await menu.update(updates, {
            where: { id }
        });

        logger.info(`Menu updated successfully - ID: ${id}`);
        return res.status(200).json({message: "Menu updated successfully", update});
        
    } catch (error) {
        logger.error(`Error updating menu ID ${id}: ${error.message}`);
        return res.status(500).json({message: "Error while updating menu", error});
    }
}


const deleteMenu = async(req, res) => {
    const {id} = req.params;
    
    try {
        logger.info(`Deleting menu ID: ${id}`);
        const menu = await Menu.findByPk(id);
        if(!menu) {
            logger.warn(`Menu not found for deletion - ID: ${id}`);
            return res.status(404).json({message: "Requested Menu not found"});
        }

        const deleted = await menu.save();
        
        logger.info(`Menu deleted successfully - ID: ${id}`);
        return res.status(201).json({message: "Menu deleted successfully", deleted});

    } catch (error) {
        logger.error(`Error deleting menu ID ${id}: ${error.message}`);
        return res.status(500).json({message: "Error while deleting menu"});
    }
}

const getParents = async(req, res) => {
    try {
        logger.info('Fetching all parent menus');

        const menu = await Menu.findAll({
            attributes: ['parent'],
            group: ['parent'],
        });

        logger.info(`Retrieved ${menu.length} parent menus`);
        return res.status(200).json({message: "Parents fetched successfully", menu});
        
    } catch (error) {
        logger.error(`Error fetching parent menus: ${error.message}`);
        return res.status(500).json({message: "Error while getting parents", error: error.message});
    }
}

export { createMenu, getMenuList, updateMenu, deleteMenu,getParents }