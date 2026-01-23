import jwt from "jsonwebtoken";
import { Employee } from "../model/employee.model.js";

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
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, "this is recruite portal json web token secret key");

    // console.log("Decoded Token:", decoded);

    const user = await Employee.findOne({ where: { em_id: decoded.id } });

    if (!user) {
      return res.status(401).json({ message: "id not found Unauthorized" });
    }

    req.user = {
      id: user.em_id,
      username: user.em_username,
      email: user.em_email,
      role: user.role_id
    };

    console.log("Authenticated User:", req.user);

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default authenticateUser;