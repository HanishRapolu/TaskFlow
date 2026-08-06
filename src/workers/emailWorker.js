import { Worker } from 'bullmq';
import { sendEmail } from '../utils/mailer.js';
import dotenv from 'dotenv';
dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
};

let emailWorker = null;

const startEmailWorker = async () => {
  try {
    emailWorker = new Worker(
      'taskQueue',
      async (job) => {
        console.log(`Processing job ${job.id} of type ${job.name}`);

        if (job.name === 'sendInviteEmail') {
          const { email, workspaceName, inviteLink } = job.data;

          const subject = `You've been invited to join ${workspaceName} on TaskFlow!`;
          const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2>Welcome to TaskFlow!</h2>
              <p>You have been invited to join the workspace <strong>${workspaceName}</strong>.</p>
              <p>Click the button below to accept the invitation:</p>
              <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #6366f1; color: #fff; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p><a href="${inviteLink}">${inviteLink}</a></p>
              <p>This link will expire in 24 hours for your security.</p>
            </div>
          `;

          await sendEmail(email, subject, html);
          console.log(`Email successfully sent to ${email}`);
        }
      },
      { connection }
    );

    emailWorker.on('completed', (job) => {
      console.log(`Job ${job.id} has completed!`);
    });

    emailWorker.on('failed', (job, err) => {
      console.error(`Job ${job.id} has failed with ${err.message}`);
    });

    emailWorker.on('error', (err) => {
      console.error('Email worker error:', err.message);
    });
  } catch (error) {
    console.error('Email worker failed to start:', error.message);
  }
};

startEmailWorker();

export default emailWorker;
