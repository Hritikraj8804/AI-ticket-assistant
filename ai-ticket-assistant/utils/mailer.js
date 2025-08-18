import nodemailer from "nodemailer";

// Create transporter singleton
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    // Validate required environment variables
    if (!process.env.MAILTRAP_SMTP_HOST || !process.env.MAILTRAP_SMTP_PORT || 
        !process.env.MAILTRAP_SMTP_USER || !process.env.MAILTRAP_SMTP_PASS) {
      throw new Error('Missing required SMTP configuration');
    }
    
    transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_SMTP_HOST,
      port: process.env.MAILTRAP_SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.MAILTRAP_SMTP_USER,
        pass: process.env.MAILTRAP_SMTP_PASS,
      },
    });
  }
  return transporter;
};

export const sendMail = async (to, subject, text) => {
  try {
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: '"Inngest TMS" <noreply@inngest.com>',
      to,
      subject,
      text,
    });

    console.log("Message sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Mail error", error.message);
    throw error;
  }
};