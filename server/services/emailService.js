import { google } from "googleapis";
import db from "../db/connection.js";

function buildEmailHTML(invoice, body) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; 
    margin: 0 auto; padding: 20px; background: #ffffff;">
      <div style="background: #1a1a2e; padding: 20px; 
      border-radius: 8px 8px 0 0;">
        <h2 style="color: #ffffff; margin: 0;">Payment Reminder</h2>
      </div>
      <div style="border: 1px solid #e0e0e0; padding: 20px; 
      border-radius: 0 0 8px 8px;">
        <div style="background: #f8f9fa; padding: 15px; 
        border-radius: 8px; margin: 15px 0;">
          <p style="margin:4px 0;"><strong>Invoice:</strong> 
          ${invoice.invoice_number}</p>
          <p style="margin:4px 0;"><strong>Amount Due:</strong> 
          ${invoice.currency} ${invoice.amount}</p>
          <p style="margin:4px 0;"><strong>Due Date:</strong> 
          ${invoice.due_date}</p>
          <p style="margin:4px 0;"><strong>Status:</strong> 
          ${invoice.status.toUpperCase()}</p>
        </div>
        <p style="line-height: 1.6;">
          ${body.replace(/\n/g, "<br/>")}
        </p>
        <div style="text-align: center; margin: 25px 0;">
          <span style="background: #1a1a2e; color: white; 
          padding: 12px 30px; border-radius: 6px; 
          font-weight: bold;">Please Process Payment</span>
        </div>
        <hr style="border: none; border-top: 1px solid #eee;"/>
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated payment reminder.
        </p>
      </div>
    </div>
  `;
}

function getEmailBody(invoice) {
  const due = new Date(invoice.due_date);
  const today = new Date();
  const daysOverdue = Math.floor((today - due) / (1000 * 60 * 60 * 24));

  if (daysOverdue > 14) {
    return `Dear ${invoice.client_name},\n\nThis is an urgent reminder that invoice ${invoice.invoice_number} for ${invoice.currency} ${invoice.amount} is now ${daysOverdue} days overdue.\n\nPlease process payment immediately or contact us to discuss arrangements.\n\nThank you.`;
  }
  if (daysOverdue > 0) {
    return `Dear ${invoice.client_name},\n\nThis is a reminder that invoice ${invoice.invoice_number} for ${invoice.currency} ${invoice.amount} was due on ${invoice.due_date} and is now overdue.\n\nWe appreciate your prompt attention to this matter.\n\nThank you.`;
  }
  return `Dear ${invoice.client_name},\n\nThis is a friendly reminder that invoice ${invoice.invoice_number} for ${invoice.currency} ${invoice.amount} is due on ${invoice.due_date}.\n\nPlease ensure payment is made by the due date.\n\nThank you.`;
}

export async function sendReminderEmail(invoice, org_id) {
  const org = db.prepare(
    "SELECT gmail_user, gmail_access_token, gmail_refresh_token FROM organizations WHERE id = ?"
  ).get(org_id);

  if (!org || !org.gmail_refresh_token) {
    throw new Error("Gmail not connected. Please connect your Gmail account first.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: org.gmail_access_token,
    refresh_token: org.gmail_refresh_token,
  });

  try {
    // Check if token needs refresh
    const { credentials } = await oauth2Client.refreshAccessToken();
    if (credentials.access_token) {
      db.prepare("UPDATE organizations SET gmail_access_token = ? WHERE id = ?").run(
        credentials.access_token,
        org_id
      );
      oauth2Client.setCredentials(credentials);
    }
  } catch (err) {
    console.error("Token refresh error:", err.message);
    // If refresh fails, it might be that the user revoked access
  }

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const emailBody = getEmailBody(invoice);
  const htmlContent = buildEmailHTML(invoice, emailBody);

  const message = [
    `From: ${org.gmail_user}`,
    `To: ${invoice.client_email}`,
    `Subject: Payment Reminder – ${invoice.invoice_number} – ${invoice.currency} ${invoice.amount}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "",
    htmlContent,
  ].join("\n");

  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  });

  return emailBody;
}
