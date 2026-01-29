import { sequelize } from "../database/db.connection.js";
import { DataTypes } from "sequelize";

const CandidateInterview = sequelize.define(
  "CandidateInterview",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    candidate_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'candidate_register',
        key: 'candidate_id'
      }
    },

    interview_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'interviews',
        key: 'interview_id'
      }
    },

    interview_question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'interview_questions',
        key: 'id'
      }
    },

    question_answer: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Text transcription or description of the answer'
    },

    question_video_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Video file URL or path'
    },

    storage_type: {
      type: DataTypes.ENUM('local', 'cloud', 'remote'),
      allowNull: false,
      defaultValue: 'local',
      comment: 'Where the video is stored'
    },

    status: {
      type: DataTypes.ENUM('0', '1'),
      allowNull: false,
      defaultValue: '1',
      comment: '1=Active, 0=Inactive'
    },

    created_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    created_on: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
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
    tableName: "candidate_interview",
    timestamps: false,
  }
);

export { CandidateInterview };
