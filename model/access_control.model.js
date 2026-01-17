import { sequelize } from '../database/db.connection.js';
import { DataTypes } from 'sequelize';
import { Roles } from './role.model.js'
import { Menu } from './menu.model.js'

const Permission = sequelize.define('uac_access_controls',{

     id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    menu_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Menu,
            key: 'id'
        }
    },
    role_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Roles,
            key: 'id'
        }
    },
    readp: DataTypes.INTEGER,
    writep: DataTypes.INTEGER,
    updatep: DataTypes.INTEGER,
    deletep: DataTypes.INTEGER,
    start_time: DataTypes.TIME,
    end_time: DataTypes.TIME
    
},
{
    tableName: 'uac_access_controls',
    timestamps: false
})

Permission.belongsTo(Roles, { foreignKey: "role_id" , as: 'Role'});
Permission.belongsTo(Menu, { foreignKey: 'menu_id', as: 'Menu' });
Menu.hasMany(Permission, { foreignKey: "menu_id", as: "Permissions" });


export { Permission }