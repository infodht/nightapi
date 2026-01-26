import jwt from "jsonwebtoken";
import { Employee } from "../model/employee.model.js";
import logger from "../logger/logger.js";

const authenticateUser = async (req, res, next) => {
  try {
    // ALLOW PUBLIC ACCESS TO UPLOADED FILES (PDF / IMAGE)
    if (
      req.method === "GET" &&
      req.originalUrl.startsWith("/uploads")
    ) {
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn(`Auth failed - Missing or invalid authorization header from ${req.ip}`);
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, "this is recruite portal json web token secret key");

    const user = await Employee.findOne({ where: { em_id: decoded.id } });

    if (!user) {
      logger.warn(`Auth failed - User ID not found: ${decoded.id}`);
      return res.status(401).json({ message: "id not found Unauthorized" });
    }

    req.user = {
      id: user.em_id,
      username: user.em_username,
      email: user.em_email,
      role: user.role_id
    };

    logger.info(`User authenticated successfully - ID: ${user.em_id}, Email: ${user.em_email}`);

    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default authenticateUser;