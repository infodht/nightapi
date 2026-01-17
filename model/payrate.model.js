import { sequelize } from "../database/db.connection.js";
import { DataTypes } from "sequelize";
import { job_title } from "./job_title.model.js";

const Payrate = sequelize.define('payrate', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    client_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    job_title: DataTypes.STRING,
    regular_day_morning: DataTypes.DECIMAL,
    regular_day_afternoon: DataTypes.DECIMAL,
    regular_day_night: DataTypes.DECIMAL,
    regular_day_weekend_morning: DataTypes.DECIMAL,
    regular_day_weekend_afternoon: DataTypes.DECIMAL,
    regular_day_weekend_night: DataTypes.DECIMAL,
    regular_day_sleep_in: DataTypes.DECIMAL,
    regular_day_waking_night_weekday: DataTypes.DECIMAL,
    regular_day_waking_night_weekend: DataTypes.DECIMAL,
    regular_day_morning: DataTypes.DECIMAL,
    bank_holiday_morning: DataTypes.DECIMAL,
    bank_holiday_afternoon: DataTypes.DECIMAL,
    bank_holiday_night: DataTypes.DECIMAL,
    bank_holiday_sleep_in: DataTypes.DECIMAL,
    bank_holiday_waking_night: DataTypes.DECIMAL,

    status: {
        type: DataTypes.ENUM(0,1),
        allowNull: false,
        defaultValue: 1
    },

    created_by: {
        type: DataTypes.STRING,
        allowNull: false
    },

    updated_by: {
        type: DataTypes.STRING,
        allowNull: true
    },

    deleted_by: {
        type: DataTypes.STRING,
        allowNull: true
    },

    created_on: {
        type: DataTypes.DATE,
        allowNull: false
    },

    updated_on: {
        type: DataTypes.DATE,
        allowNull: true
    },

    deleted_on: {
        type: DataTypes.DATE,
        allowNull: true
    },

    deleted:{
        type: DataTypes.ENUM("Y", "N"),
        allowNull: false,
        defaultValue: "N"
    }
},
{
    tableName: 'pay_rates',
    timestamps: false
})

Payrate.belongsTo(job_title, { foreignKey: "job_title", as: "jobTitle" });
job_title.hasMany(Payrate, { foreignKey: "job_title", as: "payRates" });

export { Payrate };