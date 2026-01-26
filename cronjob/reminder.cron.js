import cron from "node-cron";
import { sendDraftReminders } from "../controller/mail.controller.js";
import logger from "../logger/logger.js";

// Run every 8 hours
cron.schedule("0 */8 * * *", async () => {
    try {
        logger.info("Draft reminder cron started");
        await sendDraftReminders();
        logger.info("Draft reminder cron finished successfully");
    } catch (error) {
        logger.error(`Draft reminder cron failed: ${error.message}`);
    }
});