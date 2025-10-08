import nodemailer from "nodemailer";

/**
 * Email transporter configuration
 * Uses SMTP settings from environment variables
 */
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Verify transporter configuration
 * Call this on server startup to ensure email is configured correctly
 */
export async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log("✅ Email transporter is ready");
    return true;
  } catch (error) {
    console.error("❌ Email transporter error:", error);
    return false;
  }
}

