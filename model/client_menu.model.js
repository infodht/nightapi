import { sequelize } from "../database/db.connection.js";
import { DataTypes } from "sequelize";

const clientMenu = sequelize.define('client_menu',{
    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    },

    menu_name: DataTypes.STRING,
    url: DataTypes.STRING,
    icon: DataTypes.STRING,
    parent_id: DataTypes.INTEGER,
    
    active: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
    
},{
    tableName: 'client_menu',
    timestamps: false
})

clientMenu.belongsTo(clientMenu, {foreignKey: 'parent_id', as: 'parentMenu'});
clientMenu.hasMany(clientMenu, { foreignKey: 'parent_id', as: 'subMenu'});

export { clientMenu };