import { app } from './app.js';
import { sequelize } from './database/db.connection.js';

sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

    app.listen(process.env.PORT, () => {
        console.log(`app listening on port ${process.env.PORT}`)
    })

    process.on('SIGINT', async () => {
    await sequelize.close();
    console.log('Database connection closed.');
    process.exit(0);
    });
