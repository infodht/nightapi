import { sequelize } from "../database/db.connection.js";
import { DataTypes } from "sequelize";
import { client_needs } from "./client_needs.model.js";
import { skills } from "./skills.model.js";
import { careFacility } from "./care_facility.model.js";
import { job_title } from "./job_title.model.js";

const Candidate = sequelize.define("candidate_register", {
  candidate_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  em_id: {
        type: DataTypes.STRING,
        // allowNull: false
    },

  candidate_name: DataTypes.STRING,
  profile_img: DataTypes.TEXT,
  post_code: DataTypes.STRING,
  address_line_1: DataTypes.TEXT,
  address_line_2: DataTypes.STRING,
  landline_no: DataTypes.STRING,
  place: DataTypes.STRING,
  email_id: DataTypes.STRING,
  countryCode: DataTypes.STRING,
  mobile_number: DataTypes.STRING,
  candidate_dob: DataTypes.DATEONLY,
  passport: DataTypes.STRING,
  other_passport: DataTypes.STRING,
  is_visa_for_uk: DataTypes.STRING,
  experience: DataTypes.TEXT,
  care_facility: DataTypes.STRING,
  skills: DataTypes.STRING,
  client_need: DataTypes.STRING,
  job_title: DataTypes.STRING,
  upload_cv: DataTypes.TEXT,
  driver_car_owner: DataTypes.STRING,
  dbs: DataTypes.STRING,
  dbs_workforce_type: DataTypes.STRING,
  current_salary: DataTypes.DECIMAL(10, 2),
  desired_salary: DataTypes.DECIMAL(10, 2),
  notice_period: DataTypes.STRING,
  reason_for_leave: DataTypes.TEXT,
  current_position: DataTypes.STRING,
  current_company_name: DataTypes.STRING,
  w_u_consider: DataTypes.ENUM("Yes", "No"),
  advert_ref: DataTypes.STRING,
  engine_name: DataTypes.STRING,
  media_name: DataTypes.STRING,
  ig: DataTypes.STRING,
  fb: DataTypes.STRING,
  twitter: DataTypes.STRING,
  tiktok: DataTypes.STRING,
  driver: DataTypes.STRING,
  emergency_shift: DataTypes.STRING,
  other_detail: DataTypes.TEXT,

  umbrella_company_name: DataTypes.STRING,
  umbrella_company_email: DataTypes.STRING,
  umbrella_company_number: DataTypes.STRING,

  bank_name: DataTypes.STRING,
  bank_address: DataTypes.TEXT,
  bank_sort_code: DataTypes.STRING,
  account_number: DataTypes.STRING,
  std_hour_rate: DataTypes.STRING,
  sleep_hour: DataTypes.STRING,
  weekend_pay: DataTypes.STRING,
  bank_holiday_pay_rate: DataTypes.STRING,
  national_insurance: DataTypes.STRING,

  status: DataTypes.ENUM("0", "1"),
  form_status: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED", "FIRST_APPROVED"),

  position_title: DataTypes.STRING,
  interview_questions: DataTypes.JSON,
  interview_video_answers: DataTypes.JSON,
  interview_completed_at: DataTypes.DATE,
  storage_type: {
    type: DataTypes.ENUM("local", "cloud", "remote"),
    allowNull: true, // matches DB
    defaultValue: "local",
  },
  refnow_id: DataTypes.STRING,
  created_on: DataTypes.DATE,
  created_by: DataTypes.STRING,
  updated_on: DataTypes.DATE,
  updated_by: DataTypes.STRING,
  is_deleted: DataTypes.STRING,
  deleted_on: DataTypes.DATE,
  deleted_by: DataTypes.STRING,
}, {
  tableName: "candidate_register",
  timestamps: false, 
});

Candidate.belongsTo(client_needs, { foreignKey: "client_need", as: "clientNeed" });
Candidate.belongsTo(skills, { foreignKey: "skills", as: "skill" });
Candidate.belongsTo(careFacility, { foreignKey: "care_facility", as: "facility" });
Candidate.belongsTo(job_title, { foreignKey: "job_title", as: "titles"  });

export { Candidate };
