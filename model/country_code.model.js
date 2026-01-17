import { sequelize } from "../database/db.connection.js";
import { DataTypes } from "sequelize";

const countryCode = sequelize.define('country_code', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    iso: {
        type: DataTypes.STRING,
        allowNull: false
    },

    name: {
        type: DataTypes.STRING,
        allowNull: false
    },

    niceName: {
        type: DataTypes.STRING,
        allowNull: false
    },

    iso3: {
        type: DataTypes.STRING,
        allowNull: false
    },

    numcode: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    phonecode: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    status: {
        type: DataTypes.ENUM(0,1),
        allowNull: false
    }
},
{
    tableName: 'country_code',
    timestamps: false
})


export { countryCode };