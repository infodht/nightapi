import { sequelize } from "../database/db.connection.js";
import { DataTypes } from "sequelize";

const candidateMenu = sequelize.define('candidate_menu',{
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
    tableName: 'candidate_menu',
    timestamps: false
})

candidateMenu.belongsTo(candidateMenu, {foreignKey: 'parent_id', as: 'parentMenu'});
candidateMenu.hasMany(candidateMenu, { foreignKey: 'parent_id', as: 'subMenu'});

export { candidateMenu };