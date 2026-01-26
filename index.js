import { app } from './app.js';
import { sequelize } from './database/db.connection.js';
import logger from './logger/logger.js';

sequelize.authenticate()
    .then(() => {
        logger.info('Database connection established successfully');
    })
    .catch(err => {
        logger.error(`Database connection failed: ${err.message}`);
    });

    app.listen(process.env.PORT, () => {
        logger.info(`Server listening on port ${process.env.PORT}`);
    })

    process.on('SIGINT', async () => {
    await sequelize.close();
    logger.info('Database connection closed - Server shutdown gracefully');
    process.exit(0);
    });
