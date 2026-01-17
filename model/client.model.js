import { sequelize } from '../database/db.connection.js';
import { DataTypes } from 'sequelize';

const Client = sequelize.define('client_register',{
    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    },

    em_id: {
        type: DataTypes.STRING,
        // allowNull: false
    },

    client_organisation: {
        type: DataTypes.STRING,
        allowNull: false
    },

    post_code: {
        type: DataTypes.STRING,
        allowNull: false
    },

    place: {
        type: DataTypes.STRING,
        allowNull: false
    },

    register_address: {
        type: DataTypes.STRING,
        allowNull: false
    },

    vat_number: {
        type: DataTypes.STRING,
        allowNull: false
    },

    company_reg: {
        type: DataTypes.STRING,
        allowNull: false
    },

    website: {
        type: DataTypes.STRING,
        allowNull: false
    },

    parent_entity: DataTypes.STRING,
    client_logo: DataTypes.TEXT,
    monthly_cost: DataTypes.DECIMAL(10, 2),
    monthly_payroll: DataTypes.DECIMAL(10, 2),
    payroll_timesheet: DataTypes.STRING,
    subscription_type: DataTypes.STRING,
    no_payroll: DataTypes.STRING,
    main_fullName: DataTypes.STRING,
    main_position: DataTypes.STRING,
    main_email: DataTypes.STRING,
    mobile_number: DataTypes.STRING,
    mobile_code: DataTypes.STRING,
    upload: DataTypes.TEXT,

    finance_name: DataTypes.STRING,
    finance_no: DataTypes.STRING,
    finance_position: DataTypes.STRING,
    finance_mobile_code: DataTypes.STRING,
    finance_mobile: DataTypes.STRING,
    finance_entity_address: DataTypes.TEXT,
    finance_email: DataTypes.STRING,
    finance_cradit_limit: DataTypes.STRING,

    billing_name: DataTypes.STRING,
    billing_position: DataTypes.STRING,
    billing_number: DataTypes.STRING,
    billing_mobile_code: DataTypes.STRING,
    billing_mobile: DataTypes.STRING,
    billing_email: DataTypes.STRING,
    billing_entity_address: DataTypes.TEXT,

    status: DataTypes.ENUM("0", "1"),
    storage_type: {
        type: DataTypes.ENUM("local", "cloud"),
        allowNull: true, // matches DB
        defaultValue: "local",
    },
    deleted: DataTypes.ENUM("Y", "N"),

    created_on: DataTypes.DATE,
    created_by: DataTypes.STRING,
    updated_on: DataTypes.DATE,
    updated_by: DataTypes.STRING,
    deleted_by: DataTypes.STRING,
    deleted_on: DataTypes.DATE,

    lan_number: DataTypes.STRING,
    lan_code: DataTypes.STRING,

},{
    tableName: 'client_register',
    timestamps: false
})

export { Client };