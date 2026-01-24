import { candidateMenu } from "../model/candidate_menu.model.js";
import logger from '../logger/logger.js';

const createMenu = async (req, res) => {
    try {
        const { menuName, url, icon, parent_id, active } = req.body;
        logger.info(`Creating candidate menu: ${menuName}`);

        if (!menuName || !url) {
             logger.warn('Candidate menu creation - missing menuName or url');
             return res.status(400).json({ message: "All fields are required" });
        }

        const existingMenu = await candidateMenu.findOne({ where: { menu_name: menuName } });

        if (existingMenu) {
            logger.warn(`Candidate menu already exists: ${menuName}`);
            return res.status(400).json({ message: "Menu already exists" });
        }

        let parentMenu = null;
        if (parent_id) {
        parentMenu = await candidateMenu.findByPk(parent_id);
        if (!parentMenu) {
            logger.warn(`Parent menu not found for parent_id: ${parent_id}`);
            return res
            .status(400)
            .json({message: 'Parent menu does not exist'});
        }
        }

        const menu = await candidateMenu.create({ 
            menu_name: menuName, 
            url, 
            icon, 
            parent_id: parent_id || null, 
            active, 
    
         });

         logger.info(`Candidate menu created successfully: ${menuName} (ID: ${menu.id})`);
         return res.status(201).json({ message: "Candidate menu created successfully", menu });
    } catch (error) {
        logger.error(`Error creating candidate menu: ${error.message}`);
         return res.status(500).json({message: "Error while getting menu list", error});
    }
};

const getMenuList = async(req, res) => {
    try {
        logger.info('Fetching all candidate menus');
        
        const data = await candidateMenu.findAll({
        // order: [['menu_sequence', 'ASC']], 
        include: [
            {
            model: candidateMenu,
            as: 'parentMenu',
            attributes: ['id', 'menu_name'] 
            }
        ]
        });

        // console.log("Fetched Menus:", menu);
        logger.info(`Retrieved ${data.length} candidate menus`);
        return res.status(200).json({message: "Candidate Menu list fetched successfully", data});

        
    } catch (error) {
       logger.error(`Error fetching candidate menus: ${error.message}`);
       return res.status(500).json({message: "Error while getting menu list", error});
    }
}

export {
    createMenu,
    getMenuList
}