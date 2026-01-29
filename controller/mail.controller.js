import nodemailer from 'nodemailer';
import { mailConfig } from '../model/mail_config.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import mjml2html from 'mjml';
import { CandidateRegisterDraft } from "../model/candidate_register_draft.model.js";
import logger from '../logger/logger.js';
import dotenv from "dotenv";
dotenv.config();

const mailService = async () => {
  try {
    const smtp = await mailConfig.findOne();

    if (!smtp) {
      logger.warn("SMTP configuration not found in database");
      return res.status(500).json({ message: "SMTP configuration not found" });
    }

    logger.info("SMTP configuration fetched successfully");

    const transporter = nodemailer.createTransport({
      host: smtp.smtp_host,
      port: smtp.smtp_port,
      secure: smtp.secure,
      auth: {
        user: smtp.smtp_user,
        pass: smtp.smtp_password,
      },
    });

    return { transporter, smtp };
  } catch (error) {
    logger.error(`Error in mailService: ${error.message}`);
    // Throw so calling function knows something went wrong
    throw error;
  }
};

const sendMail = async (req, res) => {
  const { to, subject, candidate, text } = req.body;

  try {
    logger.info(`Email send request - To: ${to}, Candidate: ${candidate.candidate_name}`);

    if (!to || !subject || (!candidate)) {
      logger.warn(`Email send - Missing required fields - To: ${to}, Subject: ${subject}`);
      return res.status(400).json({ message: "Missing email fields" });
    }

    const mjmlTemplate = `
        <mjml>
          <mj-head>
            <mj-attributes>
              <mj-all font-family="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" />
              <mj-text color="#374151" line-height="1.6" />
              <mj-section padding="0" />
              <mj-column padding="0" />
            </mj-attributes>

            <mj-style inline="inline">
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              .header-bg { 
                background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); 
              }
              .card-radius {
                border-radius: 12px;
              }
              .bullet-point {
                color: #2563eb;
                padding-right: 8px;
              }
            </mj-style>
          </mj-head>

          <mj-body background-color="#FAD2CF">

            <!-- HEADER -->
          <mj-section padding="40px 0 20px" background-color="#0A1744">
              <mj-column>
                <!-- Centered image at the top -->
                  <mj-image 
                    src="https://www.nightingale-care.co.uk/_webedit/cached-images/69-0-0-0-10000-10000-340.png" 
                    alt="Nightingale Logo" 
                    width="250px" 
                    align="center" 
                    padding="0 0 20px 0"
                  />
                <!-- Nightingale text -->
                <mj-text align="center" color="#ffffff" font-size="25px" font-weight="600">
                 Application Received
                </mj-text>
              </mj-column>
            </mj-section>

            <!-- CARD WRAPPER -->
            <mj-section background-color="#0A1744" padding="40px 30px" css-class="card-radius">
              <mj-column>
                <!-- GREETING -->
                <mj-text font-size="18px" color="#dee2e6" padding="0 0 12px" font-weight="500">
                  Dear <strong style="color:#FE6C5F">${candidate.candidate_name}</strong>,
                </mj-text>

                <!-- MESSAGE 1 -->
                <mj-text font-size="15px" color="#dee2e6" padding="0 0 18px">
                  Thank you, you've successfully completed your Part 1 Registration.
                </mj-text>

                <!-- MESSAGE 2 -->
                <mj-text font-size="15px" color="#dee2e6" padding="0 0 18px">
                  You are now in the review queue for one of the 300 early-access places in Nightingale Care.
                  Our team will now assess your details, and if you meet the criteria, you will receive another email confirming whether you've secured a spot.
                </mj-text>

                <!-- MESSAGE 3 -->
                <mj-text font-size="15px" color="#dee2e6" padding="0 0 25px">
                  At this stage, nothing else is required from you.
                </mj-text>

                <mj-text font-size="18px" font-weight="600" color="#dee2e6" padding="25px 0 15px 0">
              What happens next?
            </mj-text>

            <mj-table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="border-left: 3px solid #FE6C5F; padding: 15px 0 10px 15px;">
                  <strong style="color:#dee2e6; font-size:15px;">1. Review Phase</strong><br/>
                  <span style="color:#DBDBDB; font-size:15px;">Your details are reviewed by our onboarding team</span>
                </td>
              </tr>
              <tr>
                <td style="border-left: 3px solid #FE6C5F; padding: 10px 0 10px 15px;">
                  <strong style="color:#dee2e6; font-size:15px;">2. Confirmation</strong><br/>
                  <span style="color:#DBDBDB; font-size:15px;">If successful, you will receive a confirmation email for early access</span>
                </td>
              </tr>
              <tr>
                <td style="border-left: 3px solid #FE6C5F; padding: 10px 0 25px 15px;">
                  <strong style="color:#dee2e6; font-size:15px;">3. Next Steps</strong><br/>
                  <span style="color:#DBDBDB; font-size:15px;">If selected, you will be invited to complete the next step</span>
                </td>
              </tr>
            </mj-table>

                <mj-text font-size="14px" color="#DBDBDB" padding="0 0 25px">
                  <em>Please note: completing Part 1 does not guarantee one of the 300 places, but you are now officially in the review process.</em>
                </mj-text>

                <!-- CLOSING -->
                <mj-text font-size="15px" color="#DBDBDB" padding="0 0 8px">
                  Thank you for applying,
                </mj-text>
                <mj-text font-size="15px" color="#DBDBDB" font-weight="600" padding="0">
                  Nightingale Care Team
                </mj-text>

              </mj-column>
            </mj-section>

            <!-- APPLICATION SUMMARY -->
            <mj-section background-color="#0A1744" padding="30px" css-class="card-radius">
              <mj-column>
                <mj-text font-size="18px" font-weight="600" color="#DBDBDB" padding="0 0 12px">
                  📋 Your Application Details
                </mj-text>

                <mj-table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding: 8px 0; color:#6b7280; width:150px;">Name</td>
                    <td style="padding: 8px 0; color:#DBDBDB; font-weight:500;">${candidate.candidate_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color:#6b7280;">Email</td>
                    <td style="padding: 8px 0; color:#DBDBDB; font-weight:500;">${candidate.email_id || "-"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color:#6b7280;">Mobile</td>
                    <td style="padding: 8px 0; color:#DBDBDB; font-weight:500;">${candidate.mobile_number || "-"}</td>
                  </tr>
                </mj-table>

              </mj-column>
            </mj-section>

            <!-- FOOTER -->
            <mj-section padding="30px 20px 10px">
              <mj-column>
                <mj-text align="center" color="#9ca3af" font-size="12px">
                  © ${new Date().getFullYear()} Nightingale Care. All Rights Reserved.
                </mj-text>
              </mj-column>
            </mj-section>

          </mj-body>
        </mjml>
        `;

    const { html } = mjml2html(mjmlTemplate, { validationLevel: "strict" });

    const { transporter, smtp } = await mailService();

    const senMail = await transporter.sendMail({
      from: `"RDKi Group" <${smtp.smtp_user}>`,
      to,
      subject: subject || `Application Received - ${candidate.candidate_name}`,
      text: text || `Hi ${candidate.candidate_name}, thank you for applying to RDKi Group. We have received your application and will review it shortly.`,
      html
    });

    logger.info(`Email sent successfully - To: ${to}, Message ID: ${senMail.messageId}`);
    return res.status(200).json(new ApiResponse(200, senMail, "Email sent successfully", true));

  } catch (error) {
    logger.error(`Error sending email to ${to}: ${error.message}`);
    return res.status(500).json(new ApiResponse(500, "Error while sending email", false, error));
  }
}

const sendHireflixMail = async (req, res) => {
  const { to, subject, candidate, text, interviewLink, position } = req.body;

  try {
    logger.info(`Hireflix email send request - To: ${to}, Candidate: ${candidate.candidate_name}, Position: ${position.name}`);

    if (!to || !subject || (!candidate)) {
      logger.warn(`Hireflix email - Missing required fields - To: ${to}, Subject: ${subject}`);
      return res.status(400).json({ message: "Missing email fields" });
    }

    // const smtp = await mailConfig.findOne();
    // if (!smtp) {
    //     return res.status(500).json({ message: "SMTP configuration not found" });
    // }

    const mjmlTemplate = `
          <mjml>
        <mj-head>
          <mj-attributes>
            <mj-all font-family="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" line-height="1.6" />
            <mj-text color="#374151" padding="0 0 16px 0" />
            <mj-button background-color="#10b981" color="#ffffff" border-radius="8px" font-weight="600" font-size="16px" padding="16px 32px" />
          </mj-attributes>

          <mj-style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            .gradient-bg { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
            .preheader { display: none !important; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; mso-hide: all; }
          </mj-style>
        </mj-head>

        <mj-body background-color="#FAD2CF">

          <!-- Preheader -->
          <mj-section padding="0">
            <mj-column>
              <mj-text css-class="preheader">
                Video interview invitation for ${position.name} - Complete within 48 hours
              </mj-text>
            </mj-column>
          </mj-section>

          <!-- Header -->
          <mj-section padding="40px 0 20px" background-color="#0A1744">
              <mj-column>
                <!-- Centered image at the top -->
                  <mj-image 
                    src="https://www.nightingale-care.co.uk/_webedit/cached-images/69-0-0-0-10000-10000-340.png" 
                    alt="Nightingale Logo" 
                    width="250px" 
                    align="center" 
                    padding="0 0 20px 0"
                  />
                <!-- Nightingale text -->
                <mj-text align="center" color="#ffffff" font-size="25px" font-weight="600" style="white-space: nowrap;">
                 Video Interview Invitation
                </mj-text>
              </mj-column>
            </mj-section>

          <!-- Main Content -->
          <mj-section background-color="#0A1744" padding="40px 30px">
            <mj-column>
              <mj-text font-size="18px" color="#ffff">
                Hi <strong style="color:#FE6C5F">${candidate.candidate_name}</strong>,
              </mj-text>

              <mj-text font-size="16px" color="#ffff">
                Thank you for your interest in the <strong>${position.name}</strong> position at Nightingale Group! . We look forward to learning more about you.
              </mj-text>

              <mj-divider border-color="#ffff" border-width="1px" padding="20px 0" />

              <mj-text font-size="16px" color="#ffff" font-weight="600">
                Next Step: Brief video interview
              </mj-text>

              <mj-text font-size="15px" color="#6b7280">
                This will help us get to know you better and understand your qualifications. The interview should take just a few minutes to complete.
              </mj-text>

              <!-- Important Info Box -->
              <mj-wrapper background-color="#FE6C5F" border="1px solid #ff474c" border-radius="8px" padding="20px 25px" margin="20px 0">
                <mj-section padding="0">
                  <mj-column>
                    <mj-text font-size="14px" color="#ffff" font-weight="600">
                      ⏰ Important Details:
                    </mj-text>
                    <mj-text font-size="13px" color="#ffff">
                      • Complete within <strong>48 hours</strong><br/>
                      • Use Chrome browser (Safari on iPhone)<br/>
                      • Find a quiet, well-lit space<br/>
                      • Stable internet connection required
                    </mj-text>
                  </mj-column>
                </mj-section>
              </mj-wrapper>

              <!-- CTA Button -->
              <mj-section padding="10px 0">
                <mj-column>
                  <mj-button href="${interviewLink}" align="center" background-color="#FE6C5F">
                    Start Video Interview
                  </mj-button>
                  <mj-text font-size="13px" color="#ffff" align="center" padding="10px 0 0">
                    Estimated time: 10–15 minutes
                  </mj-text>
                </mj-column>
              </mj-section>

              <mj-divider border-color="#e5e7eb" border-width="1px" padding="20px 0" />

              <mj-text font-size="15px" color="#ffff">
                If you encounter any technical issues or have questions, please don't hesitate to reach out to our team.
              </mj-text>

              <mj-text font-size="16px" color="#fff" font-weight="600">
                Best regards,<br/>
                <span style="color: #FE6C5F;">Nightingale Group</span>
              </mj-text>
            </mj-column>
          </mj-section>

          <!-- Tips Section -->
          <mj-section background-color="#FAD2CF" padding="20px 30px">
            <mj-column>
              <mj-text font-size="14px" font-weight="600" color="#374151">
                💡 Interview Tips:
              </mj-text>
              <mj-text font-size="13px" color="#6b7280">
                • Test your camera and microphone beforehand<br/>
                • Dress professionally<br/>
                • Be prepared to discuss your experience<br/>
                • Find a neutral background
              </mj-text>
            </mj-column>
          </mj-section>

          <!-- Footer -->
          <mj-section padding="30px 30px 20px">
            <mj-column>
              <mj-divider border-color="#666" border-width="1px" padding="0 0 20px" />
              <mj-text align="center" color="#9ca3af" font-size="12px" line-height="1.5">
                This message was sent by Nightingale Group.<br/>
                If you didn't expect this email, please ignore it or contact us.<br/>
                &copy; 2025 Nightingale Group Ltd. All rights reserved.
              </mj-text>
            </mj-column>
          </mj-section>

        </mj-body>
      </mjml>
          `;

    const { html } = mjml2html(mjmlTemplate, { validationLevel: "soft" });

    const { transporter, smtp } = await mailService();

    const senMail = await transporter.sendMail({
      from: `"RDKi Group" <${smtp.smtp_user}>`,
      to,
      subject: subject || `Video Interview Invitation - ${position.name}`,
      text: text || `Hi ${candidate.candidate_name}, you've been invited to complete a video interview for the ${position} position. Please complete it within 48 hours: ${interviewLink}`,
      html
    });

    logger.info(`Hireflix email sent successfully - To: ${to}, Message ID: ${senMail.messageId}`);
    return res.status(200).json(new ApiResponse(200, senMail, "Email sent successfully", true));

  } catch (error) {
    logger.error(`Error sending Hireflix email to ${to}: ${error.message}`);
    return res.status(500).json(new ApiResponse(500, "Error while sending email", false, error));
  }
}


const confirmationMail = async (req, res) => {
  const { to, email, password, name, loginUrl, subject } = req.body;
  try {
    logger.info(`Confirmation email send request - To: ${to}, Email: ${email}, Name: ${name}`);

    if (!email || !password || !name) {
      logger.warn(`Confirmation email - Missing required fields - Email: ${email}, Name: ${name}`);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, password, name'
      });
    }

    // const smtp = await mailConfig.findOne();
    //   if (!smtp) {
    //       return res.status(500).json({ message: "SMTP configuration not found" });
    //   }

    const mjmlTemplate = `
        <mjml>
        <mj-head>
          <mj-title>Login Credentials - Your Company</mj-title>
          <mj-preview>Your account credentials for Your Company</mj-preview>
          <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
          <mj-attributes>
            <mj-all font-family="Inter, Arial, sans-serif" line-height="1.6" />
            <mj-section padding="0px" />
            <mj-column padding="0px" />
          </mj-attributes>
        </mj-head>

        <mj-body background-color="#FAD2CF">
          <!-- Header Section -->
        <mj-section padding="40px 0 20px" background-color="#0A1744">
              <mj-column>
                <!-- Centered image at the top -->
                  <mj-image 
                    src="https://www.nightingale-care.co.uk/_webedit/cached-images/69-0-0-0-10000-10000-340.png" 
                    alt="Nightingale Logo" 
                    width="250px" 
                    align="center" 
                    padding="0 0 20px 0"
                  />
                <!-- Nightingale text -->
                <mj-text align="center" color="#ffffff" font-size="25px" font-weight="600" style="white-space: nowrap;">
                 Account Creadentials
                </mj-text>
              </mj-column>
            </mj-section>

          <!-- Main Content -->
          <mj-section background-color="#0A1744" padding="20px 0">
            <mj-column padding="0 40px">
              <!-- Greeting -->
              <mj-text padding="10px 0 20px" font-size="16px" color="white">
                Hello <strong>${name}</strong>,
              </mj-text>

              <mj-text padding="10px 0" font-size="16px" color="white">
                Your account has been successfully created. Here are your login credentials:
              </mj-text>

              <!-- Credentials Box -->
              <mj-section background-color="#f8f9fa" border="1px solid #e9ecef" border-radius="8px" padding="20px">
                <mj-column>
                  <!-- Email -->
                  <mj-table padding="10px 0">
                    <tr>
                      <td width="80px" style="font-weight: 600; color: #495057; padding: 8px 0;">Email:</td>
                      <td style="background-color: white; border: 1px solid #dee2e6; border-radius: 4px; padding: 8px 12px; font-family: 'Courier New', monospace; font-size: 14px;">
                        ${email}
                      </td>
                    </tr>
                    <tr>
                      <td width="80px" style="font-weight: 600; color: #495057; padding: 8px 0;">Password:</td>
                      <td style="background-color: white; border: 1px solid #dee2e6; border-radius: 4px; padding: 8px 12px; font-family: 'Courier New', monospace; font-size: 14px;">
                        ${password}
                      </td>
                    </tr>
                  </mj-table>
                </mj-column>
              </mj-section>

              <!-- Security Notice -->
               <mj-section background-color="#fff3cd" border="1px solid #ffeaa7" border-radius="8px" padding="15px">
                <mj-column>
                  <mj-text padding="0" font-size="14px" color="#856404">
                    <strong>🔒 Security Notice:</strong> For your security, we recommend changing your password after first login and never sharing your credentials with anyone.
                  </mj-text>
                </mj-column>
              </mj-section>

              <!-- Login Button -->
              <mj-text padding="20px 0 10px" font-size="16px" color="white">
                You can access your account using the button below:
              </mj-text>

              <mj-button background-color="#FE6C5F" color="#ffffff"
                        font-weight="600" 
                        border-radius="6px" 
                        padding="16px 32px"
                        href="${loginUrl}">
                Login to Your Account
              </mj-button>

              <!-- Security Tips -->
              <mj-section padding="20px 0 0">
                <mj-column>
                  <mj-text padding="0" font-size="14px" color="white">
                    <strong>Security Tips:</strong><br />
                    • Change your password regularly<br />
                    • Use a strong, unique password<br />
                    • Never share your login details<br />
                    • Log out after each session
                  </mj-text>
                </mj-column>
              </mj-section>
            </mj-column>
          </mj-section>

          <!-- Footer -->
         <mj-section background-color="#FAD2CF" padding="20px 0">
            <mj-column>
              <mj-text align="center" color="#6c757d" font-size="14px" padding="0 0 10px">
                If you have any questions, please contact our support team at 
                <a href="mailto:enquiries@nightingale-care.co.uk" style="color: #667eea; text-decoration: none;">enquiries@nightingale-care.co.uk</a>
              </mj-text>
              <mj-text align="center" color="#888" font-size="12px" padding="10px 0">
                © ${new Date().getFullYear()} Nightingale Care. All rights reserved.
              </mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>`;

    const { html } = mjml2html(mjmlTemplate, { validationLevel: "soft" });

    const { transporter, smtp } = await mailService();

    const senMail = await transporter.sendMail({
      from: `"RDKi Group" <${smtp.smtp_user}>`,
      to,
      subject: subject || `Your Account Credentials`,
      text: `Hello ${name}, your account has been created. Your login email is ${email} and your password is ${password}. Please log in at ${loginUrl}.`,
      html
    });

    logger.info(`Confirmation email sent successfully - To: ${to}, Message ID: ${senMail.messageId}`);
    return res.status(200).json(new ApiResponse(200, senMail, "Application Approved Email sent successfully", true));

  } catch (error) {
    logger.error(`Error sending confirmation email to ${to}: ${error.message}`);
    return res.status(500).json(new ApiResponse(500, "Error while sending email", false, error));
  }

}

const sendDraftReminders = async () => {
  logger.info("Draft reminder process started");

  try {
    const { transporter, smtp } = await mailService();

    logger.info("SMTP config fetched & Nodemailer transporter created successfully");

    // Fetch drafts
    let drafts;
    try {
      drafts = await CandidateRegisterDraft.findAll({
        where: { is_completed: "0" },
      });
      logger.info(`${drafts.length} uncompleted drafts fetched`);
    } catch (err) {
      logger.error(`Error fetching drafts from database: ${err.message}`);
      return;
    }

    const now = new Date();

    for (let draft of drafts) {
      try {
        const createdTime = new Date(draft.created_on);
        const lastSent = draft.last_reminder_sent ? new Date(draft.last_reminder_sent) : null;
        const hoursPassed = (now - createdTime) / (1000 * 60 * 60);
        const hoursSinceLast = lastSent ? (now - lastSent) / (1000 * 60 * 60) : null;

        // MAX reminders = 3
        if (draft.reminder_count >= 3) {
          logger.warn(`Reminder limit reached for ${draft.email_id}. No more reminders.`);
          continue;
        }

        let shouldSend = false;

        // Determine if it's time to send based on reminder_count
        if (draft.reminder_count === 0 && hoursPassed >= 24) {
          shouldSend = true; // first reminder after 24h
        } else if ((draft.reminder_count === 1 || draft.reminder_count === 2) && hoursSinceLast >= 48) {
          shouldSend = true; // second & third reminders after 48h from last
        }

        if (!shouldSend) continue;
        logger.info(`Sending reminder #${draft.reminder_count + 1} to: ${draft.email_id}`);

        // Encode values to base64
        const encodeBase64 = (value) => Buffer.from(value || "", "utf8").toString("base64");
        const encodedName = encodeBase64(draft.candidate_name);
        const encodedEmail = encodeBase64(draft.email_id);
        const encodedPhone = encodeBase64(draft.mobile_number);
        const encodedCountryCode = encodeBase64(draft.countryCode);

        const url = `${process.env.FRONTEND_BASE_URL}/P1Candidate/candidate_registration?name=${encodedName}&email=${encodedEmail}&phone=${encodedPhone}&country=${encodedCountryCode}`;

        const mjmlTemplate = `
          <mjml>
            <mj-head>
              <mj-title>Action Required: Complete Your Registration</mj-title>
              <mj-preview>Don't forget to complete your registration.</mj-preview>
              <mj-attributes>
                <mj-all font-family="Inter, Arial, sans-serif" line-height="1.6" />
              </mj-attributes>
            </mj-head>

          <mj-body background-color="#FAD2CF">

            <mj-section padding="40px 0 20px" background-color="#0A1744">
              <mj-column>
                <!-- Centered image at the top -->
                  <mj-image 
                    src="https://www.nightingale-care.co.uk/_webedit/cached-images/69-0-0-0-10000-10000-340.png" 
                    alt="Nightingale Logo" 
                    width="250px" 
                    align="center" 
                    padding="0 0 20px 0"
                  />
                <!-- Nightingale text -->
                <mj-text align="center" color="#ffffff" font-size="25px" font-weight="600" style="white-space: nowrap;">
                 Complete Your Registration
                </mj-text>
              </mj-column>
            </mj-section>
          
          <mj-section background-color="#0A1744" padding="20px 0">
            <mj-column padding="0 40px">

              <mj-text font-size="16px" color="white">
                Hello <strong>${draft.candidate_name}</strong>,
              </mj-text>

              <mj-text font-size="16px" color="white">
                It looks like you haven't completed your registration yet.
              </mj-text>

              <mj-text font-size="16px" color="white">
                Please click the button below to finish your registration.
              </mj-text>

              <mj-button background-color="#FE6C5F" color="#ffffff" font-weight="600"
                border-radius="6px" padding="16px 32px" href="${url}">
                Complete Registration
              </mj-button>

              <mj-text font-size="16px" color="white">
                Thank you,<br/>
                Nightingale Care Team
              </mj-text>

            </mj-column>
          </mj-section>
          
          <!-- FOOTER -->
          <mj-section background-color="#FAD2CF" padding="20px 0">
            <mj-column>
              <mj-text align="center" font-size="13px" color="#666666">
                This is an automated reminder. If you have already completed your registration,
                please ignore this email.
              </mj-text>
              <mj-text align="center" color="#666" font-size="13px" padding="5px 20px">
                  Visit us at
                <a href="https://www.nightingale-care.co.uk" style="color:#0A1744;">
                  www.nightingale-care.co.uk
                </a>
              </mj-text>
              <mj-text align="center" color="#888" font-size="12px" padding="10px 0">
                © ${new Date().getFullYear()} Nightingale Care. All rights reserved.
              </mj-text>
            </mj-column>
          </mj-section> 
          </mj-body>
          </mjml>`;

        // To use this in your environment:
        const { html } = mjml2html(mjmlTemplate, { validationLevel: "soft" });

        // Send email
        try {
          await transporter.sendMail({
            from: `"${smtp.mail_title}" <${smtp.smtp_user}>`,
            to: draft.email_id,
            subject: "Reminder: Complete your registration",
            html,
          });
          logger.info(`Reminder email sent to: ${draft.email_id}, Reminder count: ${draft.reminder_count + 1}`);
        } catch (err) {
          logger.error(`Failed to send email to ${draft.email_id}: ${err.message}`);
          continue; // continue with next draft
        }

        // Update draft record
        // Update draft table
        try {
          draft.reminder_count += 1;
          draft.last_reminder_sent = now;
          await draft.save();
          logger.info(`Updated draft table for ${draft.email_id}, reminder_count: ${draft.reminder_count}`);
        } catch (err) {
          logger.error(`Failed to update draft table for ${draft.email_id}: ${err.message}`);
        }
      } catch (err) {
        logger.error(`Error processing draft for ${draft.email_id}: ${err.message}`);
      }
    }
    logger.info("Draft reminder process finished");
  } catch (err) {
    logger.error(`Unexpected error in sendDraftReminders: ${err.message}`);
  }
};

export { sendMail, sendHireflixMail, confirmationMail, sendDraftReminders };