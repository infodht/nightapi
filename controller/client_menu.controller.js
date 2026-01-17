import { clientMenu } from "../model/client_menu.model.js";

const createMenu = async (req, res) => {
    try {
        const { menuName, url, icon, parent_id, active } = req.body;

        console.log("Received data:", req.body)

        if (!menuName || !url) {
             return res.status(400).json({ message: "All fields are required" });
        }

        const existingMenu = await clientMenu.findOne({ where: { menu_name: menuName } });

        if (existingMenu) {
            return res.status(400).json({ message: "Menu already exists" });
        }

        let parentMenu = null;
        if (parent_id) {
        parentMenu = await clientMenu.findByPk(parent_id);
        if (!parentMenu) {
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

         return res.status(201).json({ message: "Client menu created successfully", menu });
    } catch (error) {
        console.error("Error while creating client menu:", error);
         return res.status(500).json({message: "Error while getting menu list", error});
    }
};

const getMenuList = async(req, res) => {
    try {
        
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
        return res.status(200).json({message: "Client Menu list fetched successfully", data});

        
    } catch (error) {
       return res.status(500).json({message: "Error while getting menu list", error});
    }
}

export {
    createMenu,
    getMenuList
}