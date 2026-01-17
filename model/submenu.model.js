import { sequelize } from '../database/db.connection.js';
import { DataTypes } from 'sequelize';

const SubMenu = sequelize.define('uac_sub_menu',{
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    menu_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    sub_menu_name: DataTypes.STRING,
    sub_url: DataTypes.STRING,

    active: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }

},
{
    tableName: 'uac_sub_menu',
    timestamps: false
})

export { SubMenu };