import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: process.env.SMTP_PORT || 2525,
  auth: {
    user: process.env.SMTP_USER || 'testuser',
    pass: process.env.SMTP_PASS || 'testpass',
  },
});

const emailWorker = new Worker(
  'taskQueue',
  async (job) => {
    const { email, workspaceName, inviteLink } = job.data;
    
    console.log(`Processing email job for ${email} - Workspace: ${workspaceName}`);

    const mailOptions = {
      from: '"TaskFlow" <noreply@taskflow.com>',
      to: email,
      subject: `Invitation to join ${workspaceName}`,
      html: `
        <h1>You've been invited!</h1>
        <p>You have been invited to join the <strong>${workspaceName}</strong> workspace.</p>
        <a href="${inviteLink}">Click here to join</a>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  },
  { connection }
);

emailWorker.on('completed', (job) => {
  console.log(`Job with id ${job.id} has been completed`);
});

emailWorker.on('failed', (job, err) => {
  console.log(`Job with id ${job.id} has failed with ${err.message}`);
});

export default emailWorker;
