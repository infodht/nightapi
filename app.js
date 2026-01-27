import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authenticateUser from "./middleware/auth.middleware.js";
import path from "path";
import { fileURLToPath } from "url";
import candidateRouter from "./routes/candidate.routes.js";
import logger from "./logger/logger.js";
import countryCodeRouter from "./routes/country_code.routes.js";
import jobTitleRouter from "./routes/job_title.routes.js";
import addressRouter from "./routes/address.routes.js";
import careFacilityRouter from "./routes/care_facility.routes.js";
import skillRouter from "./routes/skills.routes.js";
import clientNeedsRouter from "./routes/client_needs.routes.js";
import authRouter from "./routes/auth.routes.js";
import roleRouter from "./routes/roles.routes.js";
import menuRouter from "./routes/menu.routes.js";
import accessRouter from "./routes/access_controle.routes.js";
import clientRouter from "./routes/client.routes.js";
import mailRouter from "./routes/mail.routes.js";
import employeeRouter from "./routes/employee.routes.js";

import "./cronjob/reminder.cron.js";
import "./cronjob/logCleanup.cron.js";
import "./cronjob/loginLogCleanup.cron.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

app.use(
  cors({
    origin: [
      "http://172.31.35.7:5173",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// public static files

app.use('/uploads/cv', express.static(path.join(__dirname, 'attach', 'upload_cv')));
app.use('/uploads/profile', express.static(path.join(__dirname, 'attach', 'uploads')));
app.use('/uploads/client/logo', express.static(path.join(__dirname, 'attach', 'client', 'logo')));
app.use('/uploads/client/contract', express.static(path.join(__dirname, 'attach', 'client', 'contract')));

// public routes

app.use("/api/auth", authRouter);
app.use("/api/candidate", candidateRouter);
app.use("/api/country-code", countryCodeRouter);
app.use("/api/job-title", jobTitleRouter);
app.use("/api/address", addressRouter);
app.use("/api/care-facility", careFacilityRouter);
app.use("/api/skill", skillRouter);
app.use("/api/client-needs", clientNeedsRouter);

// auth middleware (everything below is protected)

app.use(authenticateUser);

// protected routes

app.use("/api/role", roleRouter);
app.use("/api/menu", menuRouter);
app.use("/api/access", accessRouter);
app.use("/api/client", clientRouter);
app.use("/api/mail", mailRouter);
app.use("/api/employee", employeeRouter);

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

export { app };
// End of file: app.js