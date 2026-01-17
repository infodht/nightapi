import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import candidateRouter from './routes/candidate.routes.js'
import countryCodeRouter from './routes/country_code.routes.js'
import jobTitleRouter from './routes/job_title.routes.js'
import addressRouter from './routes/address.routes.js'
import careFacilityRouter from './routes/care_facility.routes.js'
import skillRouter from './routes/skills.routes.js'
import clientNeedsRouter from './routes/client_needs.routes.js'
import authRouter from './routes/auth.routes.js'
import roleRouter from './routes/roles.routes.js'
import menuRouter from './routes/menu.routes.js'
import accessRouter from './routes/access_controle.routes.js'
import clientRouter from './routes/client.routes.js'
import mailRouter from './routes/mail.routes.js'
import employeeRouter from "./routes/employee.routes.js"
import "./cronjob/reminder.cron.js";

const app = express();
dotenv.config();

app.use(express.json());

app.use(cors(
   {
     origin: [
        'http://172.31.35.7:5173',
        'http://localhost:5173',
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
   }
));


// app.use(requestLogger);

app.use('/uploads/cv', express.static('backend/attach/upload_cv'));
app.use('/uploads/profile', express.static('backend/attach/uploads'));
app.use('/uploads/client/logo', express.static('backend/attach/client/logo'));
app.use('/uploads/client/contract', express.static('backend/attach/client/contract'));
app.use('/api/candidate', candidateRouter);
app.use('/api/country-code', countryCodeRouter);
app.use('/api/job-title', jobTitleRouter);
app.use('/api/address', addressRouter);
app.use('/api/care-facility', careFacilityRouter);
app.use('/api/skill', skillRouter);
app.use('/api/client-needs', clientNeedsRouter);
app.use('/api/auth', authRouter);
app.use('/api/role', roleRouter);
app.use('/api/menu', menuRouter);
app.use("/api/access", accessRouter);
app.use("/api/client", clientRouter);
app.use("/api/mail", mailRouter);
app.use("/api/employee", employeeRouter);

process.on("uncaughtException", (err) => {
  crashLogger.fatal("Uncaught Exception", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  crashLogger.fatal("Unhandled Rejection", reason);
});

export { app };