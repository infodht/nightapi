import { clientMenu } from "../model/client_menu.model.js";
import logger from '../logger/logger.js';
import * as cache from "../services/cache/cache.service.js";

const createMenu = async (req, res) => {
    try {
        const { menuName, url, icon, parent_id, active } = req.body;
        logger.info(`Creating client menu: ${menuName}`);

        if (!menuName || !url) {
             logger.warn('Client menu creation - missing menuName or url');
             return res.status(400).json({ message: "All fields are required" });
        }

        const existingMenu = await clientMenu.findOne({ where: { menu_name: menuName } });

        if (existingMenu) {
            logger.warn(`Client menu already exists: ${menuName}`);
            return res.status(400).json({ message: "Menu already exists" });
        }

        let parentMenu = null;
        if (parent_id) {
        parentMenu = await clientMenu.findByPk(parent_id);
        if (!parentMenu) {
            logger.warn(`Parent menu not found for parent_id: ${parent_id}`);
            return res
            .status(400)
            .json({message: 'Parent menu does not exist'});
        }
        }

        const menu = await clientMenu.create({ 
            menu_name: menuName, 
            url, 
            icon, 
            parent_id: parent_id || null, 
            active, 
    
         });

         await cache.del("menus:client:all");

         logger.info(`Client menu created successfully: ${menuName} (ID: ${menu.id})`);
         return res.status(201).json({ message: "Client menu created successfully", menu });
    } catch (error) {
        logger.error(`Error creating client menu: ${error.message}`);
         return res.status(500).json({message: "Error while getting menu list", error});
    }
};

const getMenuList = async(req, res) => {
    try {
        logger.info('Fetching all client menus');

        const cacheKey = "menus:client:all";
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
            logger.info("Returning cached client menus");
            return res.status(200).json(cachedData);
        }
        
        const data = await clientMenu.findAll({
        // order: [['menu_sequence', 'ASC']], 
        include: [
            {
            model: clientMenu,
            as: 'parentMenu',
            attributes: ['id', 'menu_name'] 
            }
        ]
        });

        // console.log("Fetched Menus:", menu);
        logger.info(`Retrieved ${data.length} client menus`);
        const response = { message: "Client Menu list fetched successfully", data };
        await cache.set(cacheKey, response, 600);
        return res.status(200).json(response);

        
    } catch (error) {
       logger.error(`Error fetching client menus: ${error.message}`);
       return res.status(500).json({message: "Error while getting menu list", error});
    }
}

export {
    createMenu,
    getMenuList
}