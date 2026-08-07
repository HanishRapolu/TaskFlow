import { Worker } from 'bullmq';
import { sendEmail } from '../utils/mailer.js';
import dotenv from 'dotenv';
dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
};

const emailShell = (title, body) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h2>${title}</h2>
    ${body}
  </div>
`;

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

        if (job.name === 'sendMemberRemoved') {
          const { email, workspaceName } = job.data;

          const subject = `You've been removed from ${workspaceName} on TaskFlow`;
          const html = emailShell(
            `You've been removed from ${workspaceName}`,
            `<p>You have been removed from the workspace <strong>${workspaceName}</strong> on TaskFlow.</p>
             <p>You will no longer be able to access its tasks or invite links.</p>
             <p>If you think this was a mistake, please reach out to the workspace owner.</p>`
          );

          await sendEmail(email, subject, html);
          console.log(`Removal email successfully sent to ${email}`);
        }

        if (job.name === 'sendWorkspaceDeleted') {
          const { email, workspaceName } = job.data;

          const subject = `Workspace ${workspaceName} has been deleted`;
          const html = emailShell(
            `Workspace ${workspaceName} has been deleted`,
            `<p>The workspace <strong>${workspaceName}</strong> was deleted by its owner.</p>
             <p>All tasks, assignments and invites in this workspace have been removed.</p>
             <p>Thank you for being part of the team. You are no longer a member of this workspace.</p>`
          );

          await sendEmail(email, subject, html);
          console.log(`Workspace deleted email successfully sent to ${email}`);
        }

        if (job.name === 'sendCompanyDeleted') {
          const { email, companyName } = job.data;

          const subject = `Thank you for your contribution to ${companyName}`;
          const html = emailShell(
            `Thank you for your contribution to ${companyName}`,
            `<p>Your company <strong>${companyName}</strong> has been closed by its owner, and all project data has been removed.</p>
             <p>We want to say a big thank you for your contribution to the team. Every task you completed made a difference.</p>
             <p>We truly hope to work with you again soon.</p>
             <p>— The TaskFlow Team</p>`
          );

          await sendEmail(email, subject, html);
          console.log(`Company deleted email successfully sent to ${email}`);
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
