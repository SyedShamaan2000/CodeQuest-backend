const nodemailer = require("nodemailer");

/**
 * Sends an email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email plain text content
 */
const sendEmail = async (options) => {
    // Create transporter object with SMTP configuration
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST, // SMTP host
        port: process.env.EMAIL_PORT, // SMTP port
        auth: {
            user: process.env.EMAIL_USERNAME, // SMTP username
            pass: process.env.EMAIL_PASSWORD, // SMTP password
        },
    });

    // Define email options
    const mailOptions = {
        from: process.env.EMAIL_FROM, // Sender address from environment variable (e.g., "Something/Name <noreply@example.com>")
        to: options.email, // Receiver address
        subject: options.subject, // Email subject
        text: options.message, // Email body text
    };

    // Send email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
