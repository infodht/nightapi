import { sequelize } from "../database/db.connection.js";
import { DataTypes } from "sequelize";

const InterviewQuestion = sequelize.define("InterviewQuestion",{
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    interview_question_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    interview_question: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    interview_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'interviews', // Table name
            key: 'interview_id'
        }
    },
    status: {
        type: DataTypes.ENUM('0', '1'), // '1' = Active, '0' = Inactive
        allowNull: false,
        defaultValue: '1',
    },
    created_by: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    created_on: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    updated_by: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    updated_on: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    is_deleted: {
        type: DataTypes.ENUM('N', 'Y'),
        allowNull: false,
        defaultValue: 'N',
    },
    deleted_by: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    deleted_on: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    },
    {
        tableName: "interview_questions",
        timestamps: false,
    }
);

export { InterviewQuestion };
