import { sequelize } from '../database/db.connection.js';
import { DataTypes } from 'sequelize';

const mailConfig = sequelize.define('mail_config',{
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    smtp_host: DataTypes.STRING,
    smtp_port: DataTypes.INTEGER,
    smtp_user: DataTypes.STRING,
    smtp_password: DataTypes.STRING,
    ssl_type: DataTypes.STRING,
    admin_email: DataTypes.STRING,
    mail_title: DataTypes.STRING,

    created_by: {
        type: DataTypes.STRING,
        allowNull: false
    },

    created_at: {
        type: DataTypes.DATE,
        allowNull: false
    },

    updated_by: {
        type: DataTypes.STRING,
        allowNull: false
    },

    updated_at: {
        type: DataTypes.DATE,
        allowNull: false
    },

},
{
    tableName: 'm_mailconfig',
    timestamps: false
})

export { mailConfig };