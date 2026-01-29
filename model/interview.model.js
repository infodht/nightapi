import { sequelize } from "../database/db.connection.js";
import { DataTypes } from "sequelize";

const Interview = sequelize.define(
  "Interview",
  {
    interview_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    interview_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
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
    tableName: "interviews",
    timestamps: false,
  }
);

export { Interview };