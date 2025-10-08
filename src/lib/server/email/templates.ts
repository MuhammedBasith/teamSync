/**
 * Email template types and content
 */

export type EmailTemplate = 
  | "admin_invite"
  | "member_invite"
  | "welcome"
  | "password_reset"
  | "role_changed";

export interface EmailTemplateData {
  admin_invite: {
    inviterName: string;
    organizationName: string;
    inviteUrl: string;
    expiresInDays?: number;
  };
  member_invite: {
    inviterName: string;
    organizationName: string;
    teamName?: string;
    inviteUrl: string;
    expiresInDays?: number;
  };
  welcome: {
    userName: string;
    organizationName: string;
  };
  password_reset: {
    userName: string;
    resetUrl: string;
    expiresInHours: number;
  };
  role_changed: {
    userName: string;
    organizationName: string;
    oldRole: string;
    newRole: string;
    changedBy: string;
  };
}

/**
 * Generate email subject based on template type
 */
export function getEmailSubject(template: EmailTemplate, data: any): string {
  switch (template) {
    case "admin_invite":
      return `You've been invited to join ${data.organizationName} as Admin`;
    case "member_invite":
      return `You've been invited to join ${data.organizationName}`;
    case "welcome":
      return `Welcome to ${data.organizationName}!`;
    case "password_reset":
      return `Reset your password`;
    case "role_changed":
      return `Your role has been updated in ${data.organizationName}`;
    default:
      return "Notification from TeamSync";
  }
}

/**
 * Generate HTML email body based on template type
 */
export function getEmailHtml<T extends EmailTemplate>(
  template: T,
  data: EmailTemplateData[T]
): string {
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
      .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
      .button:hover { background: #2563EB; }
      .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      .badge { display: inline-block; background: #10B981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    </style>
  `;

  switch (template) {
    case "admin_invite": {
      const inviteData = data as EmailTemplateData["admin_invite"];
      return `
        <!DOCTYPE html>
        <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Admin Invitation</h1>
              </div>
              <div class="content">
                <p>Hi there!</p>
                <p><strong>${inviteData.inviterName}</strong> has invited you to join <strong>${inviteData.organizationName}</strong> as an <span class="badge">Admin</span>.</p>
                <p>As an admin, you'll be able to:</p>
                <ul>
                  <li>Manage teams and members</li>
                  <li>View organization activity logs</li>
                  <li>Invite new members</li>
                  <li>Configure team settings</li>
                </ul>
                <p style="text-align: center;">
                  <a href="${inviteData.inviteUrl}" class="button">Accept Invitation</a>
                </p>
                <p style="color: #6b7280; font-size: 14px;">
                  ${inviteData.expiresInDays ? `This invitation expires in ${inviteData.expiresInDays} days.` : "This invitation does not expire."}
                </p>
                <p style="color: #6b7280; font-size: 14px;">
                  If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} TeamSync. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    case "member_invite": {
      const inviteData = data as EmailTemplateData["member_invite"];
      return `
        <!DOCTYPE html>
        <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 You're Invited!</h1>
              </div>
              <div class="content">
                <p>Hi there!</p>
                <p><strong>${inviteData.inviterName}</strong> has invited you to join <strong>${inviteData.organizationName}</strong>${inviteData.teamName ? ` in the <strong>${inviteData.teamName}</strong> team` : ""}.</p>
                <p style="text-align: center;">
                  <a href="${inviteData.inviteUrl}" class="button">Accept Invitation</a>
                </p>
                <p style="color: #6b7280; font-size: 14px;">
                  ${inviteData.expiresInDays ? `This invitation expires in ${inviteData.expiresInDays} days.` : "This invitation does not expire."}
                </p>
                <p style="color: #6b7280; font-size: 14px;">
                  If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} TeamSync. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    case "welcome": {
      const welcomeData = data as EmailTemplateData["welcome"];
      return `
        <!DOCTYPE html>
        <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to TeamSync! 🎊</h1>
              </div>
              <div class="content">
                <p>Hi ${welcomeData.userName}!</p>
                <p>Welcome to <strong>${welcomeData.organizationName}</strong>! We're excited to have you on board.</p>
                <p>Get started by exploring your dashboard and connecting with your team.</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} TeamSync. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    case "role_changed": {
      const roleData = data as EmailTemplateData["role_changed"];
      return `
        <!DOCTYPE html>
        <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Role Updated</h1>
              </div>
              <div class="content">
                <p>Hi ${roleData.userName}!</p>
                <p>Your role in <strong>${roleData.organizationName}</strong> has been updated by <strong>${roleData.changedBy}</strong>.</p>
                <p>
                  <strong>Previous role:</strong> ${roleData.oldRole}<br>
                  <strong>New role:</strong> <span class="badge">${roleData.newRole}</span>
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} TeamSync. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    default:
      return `
        <!DOCTYPE html>
        <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="content">
                <p>You have a new notification from TeamSync.</p>
              </div>
            </div>
          </body>
        </html>
      `;
  }
}

/**
 * Generate plain text email body (fallback for non-HTML clients)
 */
export function getEmailText<T extends EmailTemplate>(
  template: T,
  data: EmailTemplateData[T]
): string {
  switch (template) {
    case "admin_invite": {
      const inviteData = data as EmailTemplateData["admin_invite"];
      return `
${inviteData.inviterName} has invited you to join ${inviteData.organizationName} as an Admin.

As an admin, you'll be able to:
- Manage teams and members
- View organization activity logs
- Invite new members
- Configure team settings

Accept invitation: ${inviteData.inviteUrl}

${inviteData.expiresInDays ? `This invitation expires in ${inviteData.expiresInDays} days.` : ""}

If you didn't expect this invitation, you can safely ignore this email.
      `.trim();
    }

    case "member_invite": {
      const inviteData = data as EmailTemplateData["member_invite"];
      return `
${inviteData.inviterName} has invited you to join ${inviteData.organizationName}${inviteData.teamName ? ` in the ${inviteData.teamName} team` : ""}.

Accept invitation: ${inviteData.inviteUrl}

${inviteData.expiresInDays ? `This invitation expires in ${inviteData.expiresInDays} days.` : ""}

If you didn't expect this invitation, you can safely ignore this email.
      `.trim();
    }

    default:
      return "You have a new notification from TeamSync.";
  }
}

