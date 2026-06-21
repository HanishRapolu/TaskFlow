import asyncHandler from 'express-async-handler';
import { taskQueue } from '../config/queue.js';
import Workspace from '../models/Workspace.js';
import AppError from '../utils/AppError.js';

import User from '../models/User.js';
import Invite from '../models/Invite.js';
import crypto from 'crypto';

export const inviteMember = asyncHandler(async (req, res) => {
  const workspaceId = req.params.id || req.params.workspaceId;
  const { email, role } = req.body; // role should be 'admin' or 'member'

  if (!email) throw new AppError('Email is required', 400);

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  // RBAC: Check inviter's role
  const inviter = workspace.members.find(m => m.userId.toString() === req.user._id.toString());
  if (!inviter) throw new AppError('Not authorized', 403);
  
  const targetRole = role || 'member';
  if (targetRole === 'admin' && inviter.role !== 'owner') {
    throw new AppError('Only owners can invite admins', 403);
  }

  // Check if user is already a member
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const isAlreadyMember = workspace.members.some(m => m.userId.toString() === existingUser._id.toString());
    if (isAlreadyMember) throw new AppError('User is already a member', 400);
  }

  // Generate secure token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Upsert the invite (if they were invited before and it expired/wasn't clicked, overwrite)
  await Invite.findOneAndUpdate(
    { workspaceId, email },
    {
      workspaceId,
      email,
      role: targetRole,
      token: hashedToken,
      invitedBy: req.user._id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    { upsert: true, returnDocument: 'after' }
  );

  const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/accept-invite/${rawToken}`;

  // Push job to taskQueue
  await taskQueue.add('sendInviteEmail', {
    email,
    workspaceName: workspace.name,
    inviteLink,
  });

  res.status(200).json({
    success: true,
    message: 'Invitation sent successfully',
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
