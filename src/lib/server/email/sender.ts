import { transporter } from "./transporter";
import {
  EmailTemplate,
  EmailTemplateData,
  getEmailSubject,
  getEmailHtml,
  getEmailText,
} from "./templates";

export interface SendEmailOptions<T extends EmailTemplate> {
  to: string | string[];
  template: T;
  data: EmailTemplateData[T];
  from?: string;
  replyTo?: string;
}

/**
 * Generic email sender function
 * Supports multiple email templates and recipients
 */
export async function sendEmail<T extends EmailTemplate>({
  to,
  template,
  data,
  from,
  replyTo,
}: SendEmailOptions<T>) {
  try {
    // Default from address
    const fromAddress =
      from || process.env.SMTP_FROM || '"TeamSync" <noreply@teamsync.com>';

    // Generate email content
    const subject = getEmailSubject(template, data);
    const html = getEmailHtml(template, data);
    const text = getEmailText(template, data);

    // Send email
    const info = await transporter.sendMail({
      from: fromAddress,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      text,
      html,
      replyTo,
    });

    console.log(`✅ Email sent: ${info.messageId} to ${to}`);

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: process.env.NODE_ENV === "development" 
        ? (await import("nodemailer")).getTestMessageUrl(info)
        : null,
    };
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send admin invitation email
 */
export async function sendAdminInviteEmail(
  to: string,
  inviterName: string,
  organizationName: string,
  inviteToken: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/signup?inviteCode=${inviteToken}`;

  return sendEmail({
    to,
    template: "admin_invite",
    data: {
      inviterName,
      organizationName,
      inviteUrl,
      expiresInDays: 7, // Optional: set expiry
    },
  });
}

/**
 * Send member invitation email
 */
export async function sendMemberInviteEmail(
  to: string,
  inviterName: string,
  organizationName: string,
  inviteToken: string,
  teamName?: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/signup?inviteCode=${inviteToken}`;

  return sendEmail({
    to,
    template: "member_invite",
    data: {
      inviterName,
      organizationName,
      inviteUrl,
      teamName,
      expiresInDays: 7,
    },
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  to: string,
  userName: string,
  organizationName: string
) {
  return sendEmail({
    to,
    template: "welcome",
    data: {
      userName,
      organizationName,
    },
  });
}

/**
 * Send role changed notification
 */
export async function sendRoleChangedEmail(
  to: string,
  userName: string,
  organizationName: string,
  oldRole: string,
  newRole: string,
  changedBy: string
) {
  return sendEmail({
    to,
    template: "role_changed",
    data: {
      userName,
      organizationName,
      oldRole,
      newRole,
      changedBy,
    },
  });
}

