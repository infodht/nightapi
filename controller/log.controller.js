import { logger, errorLogger } from "../config/logger.js";

const createUser = async (req, res) => {
  logger.info("Create user API called");
  logger.debug("Request Body:", req.body);

  try {
    res.status(201).json({ success: true });
    logger.info("User created successfully");
  } catch (err) {
    errorLogger.error("Create user failed", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { 
    createUser
};