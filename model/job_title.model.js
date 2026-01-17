import { sequelize } from "../database/db.connection.js";
import { DataTypes } from "sequelize";

const job_title = sequelize.define('job_title', {
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
        allowNull: false
    },

    created_by: {
        type: DataTypes.STRING,
        allowNull: false
    },

    created_on: {
        type: DataTypes.DATE,
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
    },
},
{
    tableName: 'job_title',
    timestamps: false
}
)

export { job_title };