import jwt from 'jsonwebtoken';
import { Employee } from '../model/employee.model.js';
import { LoginLogs } from '../model/login_logs.model.js';
import crypto from 'crypto';
import logger from '../logger/logger.js';

const login = async (req, res) => {

    try {
      const {
      password,
      email
      } = req.body

      logger.info(`Login attempt for email: ${email}`);

      if(!password || !email){
        logger.warn('Login attempt with missing email or password');
        return res.status(401).json({
          message: 'All Fields Are Required'
        })
      }

      const hashedPassword = crypto
      .createHash("sha1")
      .update(password)
      .digest("hex");

      // console.log(hashedPassword)

      const user = await Employee.findOne({
         where: { em_email: email, em_password: hashedPassword }
      });

    if(!user){
      logger.warn(`Invalid login attempt for email: ${email}`);
      return res.status(401).json({
        message: 'Invalid Credentails'
      })
    };

    const token = jwt.sign({
      name: user.first_name,
      id: user.em_id,
      roleId: user.role_id,
      role: user.em_role,
      email: user.em_email
    },"this is recruite portal json web token secret key",{
      expiresIn: "2h"
    })

    await LoginLogs.create({
      emp_id: user.em_id,
      user_id: user.id,
      emp_role: user.em_role,
      action: "Successfully Login",
      login_date: new Date(),
      ip_address: req.ip,
    })
    
    logger.info(`User logged in successfully - ID: ${user.em_id}, Email: ${user.em_email}`);
    return res.status(200)
           .json({
            message: "Login Successfully",
            token
           })

    } catch (error) {
      logger.error(`Error during login for email ${email}: ${error.message}`);
        return res.status(500).json({
            message: "Error while login"
        })
    }
 }

 export {
   login
 }