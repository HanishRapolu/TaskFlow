import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const parseFrom = (from) => {
  const match = String(from || '').match(/^(.+?)\s*<([^>]+)>/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: 'TaskFlow Team', email: String(from || 'noreply@taskflow.com').trim() };
};

const sendViaBrevoApi = async (apiKey, to, subject, html) => {
  const { name, email } = parseFrom(process.env.SMTP_FROM);

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { name, email },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${body}`);
  }

  const data = await response.json();
  console.log('Message sent via Brevo API: %s', data.messageId);
  return data;
};

const SMTP_PORT = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // 465 = implicit TLS, 587 = STARTTLS
  family: 4, // force IPv4 to avoid hangs on broken IPv6 routes
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendViaSmtp = async (to, subject, html) => {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"TaskFlow Team" <noreply@taskflow.com>',
    to,
    subject,
    html,
  });
  console.log('Message sent via SMTP: %s', info.messageId);
  return info;
};

export const sendEmail = async (to, subject, html) => {
  try {
    // Brevo's HTTP API (port 443) is reliable from cloud hosts where outbound
    // SMTP is blocked. Set BREVO_API_KEY to use it; otherwise fall back to SMTP.
    if (process.env.BREVO_API_KEY) {
      return await sendViaBrevoApi(process.env.BREVO_API_KEY, to, subject, html);
    }
    return await sendViaSmtp(to, subject, html);
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};
