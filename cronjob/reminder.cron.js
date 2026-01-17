import cron from "node-cron";
import { sendDraftReminders } from "../controller/mail.controller.js";

// Run every 8 hours
cron.schedule("0 */8 * * *", async () => {
    console.log("Running draft reminder cron job...");
    await sendDraftReminders();
});