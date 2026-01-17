import { sequelize } from '../database/db.connection.js';
import { DataTypes } from 'sequelize';

const careFacility = sequelize.define('care_facility', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    facility_name: {
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
        allowNull: false
    },

    updated_on: {
        type: DataTypes.DATE,
        allowNull: false
    },

    deleted_by: {
        type: DataTypes.STRING,
        allowNull: false
    },

    deleted_on: {
        type: DataTypes.DATE,
        allowNull: false
    },

    is_deleted: {
        type: DataTypes.ENUM('N', 'Y'),
        defaultValue: 'N',
    }

},
{
    tableName: 'care_facility',
    timestamps: false
});


export { careFacility };