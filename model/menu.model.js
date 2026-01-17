import { sequelize } from "../database/db.connection.js";
import { DataTypes } from "sequelize";

const Menu = sequelize.define('uac_menus',{
    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    },

    menu_name: DataTypes.STRING,
    url: DataTypes.STRING,
    icon: DataTypes.STRING,
    menu_sequence: DataTypes.INTEGER,
    parent_id: DataTypes.INTEGER,
    
    active: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
    
},{
    tableName: 'uac_menus',
    timestamps: false
})

Menu.belongsTo(Menu, {foreignKey: 'parent_id', as: 'parentMenu'});
Menu.hasMany(Menu, { foreignKey: 'parent_id', as: 'subMenu'});

export { Menu };