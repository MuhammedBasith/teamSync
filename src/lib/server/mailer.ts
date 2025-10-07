// Server-side email sending helpers
// This file should only be used in API routes

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(options: EmailOptions) {
  // TODO: Implement email sending using Supabase or other service
  console.log("Sending email:", options);
  
  // For now, just log the email
  // Later, integrate with Supabase Auth email or other email service
  return { success: true };
}

export async function sendInviteEmail(
  email: string,
  inviteLink: string,
  organizationName: string
) {
  return sendEmail({
    to: email,
    subject: `You're invited to join ${organizationName} on TeamSync`,
    html: `
      <h1>You've been invited!</h1>
      <p>You've been invited to join ${organizationName} on TeamSync.</p>
      <p><a href="${inviteLink}">Accept Invitation</a></p>
    `,
  });
}

