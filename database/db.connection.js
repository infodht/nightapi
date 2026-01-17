import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
    process.env.DB_NAME || 'dev_test_db',
    process.env.DB_USER || 'sql_dev',
    process.env.DB_PASS || '%iz78LN10?84',
    {
        host: process.env.DB_HOST || 'nc-mysql.cnu0iau8ivh1.eu-west-2.rds.amazonaws.com',
        dialect: 'mysql',
        logging: false,
        timezone: '+05:30'
    }
)

export { sequelize }