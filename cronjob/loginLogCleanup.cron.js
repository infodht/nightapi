import cron from "node-cron";
import { Op } from "sequelize";
import { LoginLogs } from "../model/login_logs.model.js";
import logger from "../logger/logger.js";

const RETENTION_DAYS = 60; // keep last 60 days of login logs

// Run every day at 3:00 AM
cron.schedule("0 3 * * *", async () => {
  try {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const deleted = await LoginLogs.destroy({
      where: {
        login_date: {
          [Op.lt]: cutoff,
        },
      },
    });

    logger.info(
      `Login logs cleanup completed - Deleted: ${deleted}, Cutoff: ${cutoff.toISOString().slice(0, 10)}`
    );
  } catch (error) {
    logger.error(`Login logs cleanup failed: ${error.message}`);
  }
});

export default cron;
