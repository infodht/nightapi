import { mailConfig } from "../model/mail_config.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import logger from "../logger/logger.js";

const smtpConfig = async(req, res) => {
    const{
        host,
        port,
        user,
        password,
        type,
        // admin_email,
        mail_title
    } = req.body;

    try {
        logger.info(`SMTP config request - Host: ${host}, User: ${user}`);

        const mailConfing = await mailConfig.findOne();
        if(mailConfing){
            await mailConfing.update({
                smtp_host: host,
                smtp_port: port,
                smtp_user: user,
                smtp_password: password,
                ssl_type: type,
                // admin_email: admin_email,
                mail_title: mail_title,
                updated_by: req.user,
                updated_at: new Date()
            });
            logger.info("SMTP configuration updated successfully");  
            return res.status(200).json(new ApiResponse(200,{},"SMTP Configuration updated successfully", true));
        }else{
            await mailConfig.create({
                smtp_host: host,
                smtp_port: port,
                smtp_user: user,
                smtp_password: password,
                ssl_type: type,
                // admin_email: admin_email,
                mail_title: mail_title,
                created_by: req.user,
                created_on: new Date(),
            })
            logger.info("SMTP configuration created successfully");
        }
        return res.status(200).json(new ApiResponse(200,mailConfing,"SMTP Configuration saved successfully", true));
        
    } catch (error) {
        logger.error(`Error in SMTP Configuration: ${error.message}`);
        return res.status(500).json(new ApiResponse(500,{}, error, false));
    }
}

export { smtpConfig };