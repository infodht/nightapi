import { sequelize } from "../database/db.connection.js";
import { DataTypes } from "sequelize";

const Employee = sequelize.define('employee', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    em_id: {
        type: DataTypes.STRING,
        // allowNull: false
    },
    
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    em_email: DataTypes.STRING,
    username: DataTypes.STRING,
    em_password: DataTypes.TEXT,
    em_address: DataTypes.STRING,
    em_mobile_number: DataTypes.STRING,
    em_mobile_code: DataTypes.STRING,
    em_birthday: DataTypes.DATEONLY,
    em_joining_date: DataTypes.DATEONLY,
    em_image: DataTypes.TEXT,

    em_role: DataTypes.ENUM('ADMIN', 'EMPLOYEE', 'SUPER ADMIN', 'CLIENT', 'CANDIDATE'),
    role_id: DataTypes.STRING,

    em_role: DataTypes.ENUM('ADMIN', 'EMPLOYEE', 'SUPER ADMIN', 'CANDIDATE', 'CLIENT'),
    role_id: DataTypes.INTEGER,
    em_gender: DataTypes.ENUM('Male', 'Female'),

    is_reporting: {
        type: DataTypes.ENUM('YES', 'NO'),
        defaultValue: 'NO'
    },
    status: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    supervisor_id: DataTypes.STRING,

    created_on: DataTypes.DATE,
    created_by: DataTypes.STRING,
    updated_on: DataTypes.DATE,
    updated_by: DataTypes.STRING,

}, {
    tableName: 'employee',
    timestamps: false
})

export { Employee };