import { sequelize } from "../database/db.connection.js";
import { DataTypes } from "sequelize";

const LoginLogs = sequelize.define('login_log',{
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    emp_id: DataTypes.STRING,
    user_id: DataTypes.STRING,
    emp_role: DataTypes.STRING,
    action: DataTypes.STRING,
    ip_address: DataTypes.STRING,
    login_date: DataTypes.DATE,
    latitude: DataTypes.STRING,
    longitude: DataTypes.STRING
 
},{
    tableName: 'login_log',
    timestamps: false
})

export { LoginLogs };