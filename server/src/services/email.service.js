import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

/**
 * Initialize Nodemailer transporter with connection pooling.
 * Falls back to in-memory JSON transport if no SMTP server is configured.
 */
const getTransporter = () => {
  if (transporter) return transporter;

  const hasSmtpConfig = Boolean(env.SMTP?.HOST && env.SMTP?.USER);

  if (hasSmtpConfig) {
    transporter = nodemailer.createTransport({
      host: env.SMTP.HOST,
      port: env.SMTP.PORT,
      secure: env.SMTP.PORT === 465,
      auth: {
        user: env.SMTP.USER,
        pass: env.SMTP.PASS,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  } else {
    // Fallback in development/test: Use JSON transport to log and avoid connection errors
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    console.log('[EmailService] SMTP credentials not provided; using JSON mock transport.');
  }

  return transporter;
};

/**
 * Send an email notification with retry logic.
 * Non-blocking: returns promise or can be called asynchronously.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text version
 * @param {string} options.html - Rich HTML template
 * @param {number} [retryCount=2] - Number of retry attempts on transient network failure
 */
export const sendEmail = async (options, retryCount = 2) => {
  const mailer = getTransporter();

  const mailOptions = {
    from: env.SMTP?.FROM || 'CareCircle <noreply@carecircle.com>',
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  let attempts = 0;
  while (attempts <= retryCount) {
    try {
      const info = await mailer.sendMail(mailOptions);
      if (info.message) {
        // Mock JSON transport log
        console.log(`[EmailService] Mock email logged for ${options.to}: "${options.subject}"`);
      } else {
        console.log(`[EmailService] Email sent successfully to ${options.to}. MessageId: ${info.messageId}`);
      }
      return { success: true, messageId: info.messageId || 'mock-id' };
    } catch (err) {
      attempts++;
      console.error(`[EmailService] Error sending email to ${options.to} (attempt ${attempts}/${retryCount + 1}):`, err.message);

      if (attempts > retryCount) {
        return { success: false, error: err.message };
      }

      // Exponential backoff wait before retrying (200ms, 400ms...)
      await new Promise((r) => setTimeout(r, attempts * 200));
    }
  }

  return { success: false, error: 'Max retries exceeded' };
};

/**
 * HTML Template Builder for CareCircle Notifications.
 */
export const buildNotificationEmailHtml = ({ title, message, actionLabel, actionUrl, seniorName, timeStr }) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #0f766e; padding: 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
          .header p { margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; }
          .content { padding: 28px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; background: #fef3c7; color: #92400e; margin-bottom: 16px; }
          .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; }
          .message { font-size: 15px; line-height: 1.6; color: #334155; }
          .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; }
          .details-box p { margin: 4px 0; font-size: 13px; color: #475569; }
          .details-box strong { color: #0f172a; }
          .btn-container { text-align: center; margin: 28px 0 16px 0; }
          .btn { display: inline-block; background: #0f766e; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CareCircle</h1>
            <p>Elderly Care & Medication Safety Platform</p>
          </div>
          <div class="content">
            <span class="badge">Medication Alert</span>
            <h2 class="title">${title}</h2>
            <p class="message">${message}</p>
            ${
              seniorName
                ? `
              <div class="details-box">
                <p><strong>Resident:</strong> ${seniorName}</p>
                ${timeStr ? `<p><strong>Scheduled Time:</strong> ${timeStr}</p>` : ''}
                <p><strong>Status:</strong> Requires Immediate Attention</p>
              </div>
            `
                : ''
            }
            ${
              actionUrl
                ? `
              <div class="btn-container">
                <a href="${actionUrl}" class="btn">${actionLabel || 'View in CareCircle'}</a>
              </div>
            `
                : ''
            }
          </div>
          <div class="footer">
            <p>You received this security & care notification because you are registered as an authorized Care Circle member.</p>
            <p>&copy; ${new Date().getFullYear()} CareCircle. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export default {
  sendEmail,
  buildNotificationEmailHtml,
};
