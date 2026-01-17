import { sequelize } from "../database/db.connection.js";
import { DataTypes } from "sequelize";

const client_needs = sequelize.define('client_needs', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    name: {
        type: DataTypes.STRING,
        allowNull: false
    },

     status: {
        type: DataTypes.ENUM(0,1),
        allowNull: false,
        defaultValue: 1
    },

    created_by: {
        type: DataTypes.STRING,
        allowNull: false
    },

    created_on: {
        type: DataTypes.DATE,
        allowNull: false
    },

    updated_by: {
        type: DataTypes.STRING,
    },

    updated_on: {
        type: DataTypes.DATE,
    },

    is_deleted: {
        type: DataTypes.ENUM('N', 'Y'),
        defaultValue: 'N',
    },

    deleted_by: {
        type: DataTypes.STRING,
    },

    deleted_on: {
        type: DataTypes.DATE,
    }
},
{
    tableName: 'client_needs',
    timestamps: false
})

export { client_needs };