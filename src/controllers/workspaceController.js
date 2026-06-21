import asyncHandler from 'express-async-handler';
import { taskQueue } from '../config/queue.js';
import Workspace from '../models/Workspace.js';
import AppError from '../utils/AppError.js';

import User from '../models/User.js';

export const inviteMember = asyncHandler(async (req, res) => {
  // Using 'id' for the parameter based on the route /api/workspaces/:id/invite
  const workspaceId = req.params.id;
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  // Generate an invite link for the user to click
  const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/invite/${workspaceId}?email=${encodeURIComponent(email)}`;

  // Push job to taskQueue instead of sending synchronously
  await taskQueue.add('sendInviteEmail', {
    email,
    workspaceName: workspace.name,
    inviteLink,
  });

  res.status(200).json({
    message: 'Invitation queued successfully',
  });
});

export const addMember = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { email, role } = req.body;

  const userToAdd = await User.findOne({ email });
  if (!userToAdd) throw new AppError('User not found. They must register first.', 404);

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  // Check if already a member
  const isMember = workspace.members.some(m => m.userId.toString() === userToAdd._id.toString());
  if (isMember) throw new AppError('User is already a member of this workspace', 400);

  workspace.members.push({
    userId: userToAdd._id,
    role: role || 'member'
  });

  await workspace.save();

  res.status(200).json({ success: true, message: 'Member added successfully', data: workspace });
});
