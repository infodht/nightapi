import { DataTypes } from "sequelize";
import { sequelize } from "../database/db.connection.js";

const CandidateRegisterDraft = sequelize.define(
    "candidate_register_draft",
    {
        draft_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        candidate_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },

        email_id: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },

        mobile_number: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },

        countryCode: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },

        countryCode: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },

        data: {
            type: DataTypes.JSON,
            // allowNull: false,
            allowNull: true,
            comment: "All UI form data stored here",
        },

        reminder_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            comment: "How many reminders were sent",
        },

        last_reminder_sent: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
            comment: "Timestamp when last reminder email was sent",
        },

        is_completed: {
            type: DataTypes.ENUM("1", "0"),
            allowNull: true,
            defaultValue: "0",
            comment: "0 = Not completed, 1 = Completed registration",
        },

        created_on: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
            comment: "Time when the draft record was created",
        },

        updated_on: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
            comment: "Time when the draft record was last updated",
        },
    },
    {
        tableName: "candidate_register_draft",
        timestamps: false,
    }
);

export { CandidateRegisterDraft };