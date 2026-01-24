import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../logger/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Run cleanup every day at 2:00 AM
cron.schedule('0 2 * * *', () => {
  try {
    const logsDir = path.join(__dirname, '../logs');
    
    if (!fs.existsSync(logsDir)) {
      return;
    }

    const files = fs.readdirSync(logsDir);
    const now = Date.now();

    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      const fileAgeInDays = (now - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

      // Delete app.log files older than 30 days
      if (file.includes('app.log') && fileAgeInDays > 30) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted old app.log: ${file}`);
      }

      // Delete error.log files older than 30 days
      if (file.includes('error.log') && fileAgeInDays > 30) {
        fs.unlinkSync(filePath);
        logger.error(`Deleted old error.log: ${file}`);
      }
    });

    logger.info('Log cleanup completed');
  } catch (error) {
    logger.error(`Log cleanup failed: ${error.message}`);
  }
});

export default cron;
