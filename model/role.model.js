import { sequelize } from "../database/db.connection.js";
import { DataTypes } from "sequelize";

const Roles = sequelize.define('uac_roles', {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    rolename:DataTypes.STRING,
    remarks: DataTypes.STRING,
    status: DataTypes.INTEGER,

    insert_on: DataTypes.DATE,
    insert_by: DataTypes.STRING,
    update_on: DataTypes.DATE,
    update_by: DataTypes.STRING,
    delete_on: DataTypes.DATE,
    delete_by: DataTypes.STRING,
    is_deleted: {
    type: DataTypes.ENUM('N', 'Y'),
    defaultValue: 'N',
  }
  
},{
    tableName: 'uac_roles',
    timestamps: false
})

export { Roles };