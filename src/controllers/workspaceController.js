import asyncHandler from 'express-async-handler';
import { taskQueue } from '../config/queue.js';
import Workspace from '../models/Workspace.js';
import AppError from '../utils/AppError.js';

import User from '../models/User.js';
import Invite from '../models/Invite.js';
import Task from '../models/Task.js';
import { assertNoCrossWorkspaceMembership } from '../utils/workspaceRules.js';
import crypto from 'crypto';

export const getWorkspace = asyncHandler(async (req, res) => {
  const workspaceId = req.params.workspaceId || req.params.id;
  
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  // Find the current user's role in this workspace
  const member = workspace.members.find(m => m.userId.toString() === req.user._id.toString());
  if (!member) throw new AppError('You are not a member of this workspace', 403);

  res.status(200).json({
    success: true,
    data: {
      _id: workspace._id,
      name: workspace.name,
      description: workspace.description,
      role: member.role,
    }
  });
});

// @desc    Get workspace members and pending invites
// @route   GET /api/workspaces/:workspaceId/members
// @access  Private (Workspace members)
export const getWorkspaceMembers = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;

  const workspace = await Workspace.findById(workspaceId).populate('members.userId', 'name email avatar');
  if (!workspace) throw new AppError('Workspace not found', 404);

  // Check if user is a member
  const requester = workspace.members.find(m => {
    const uid = m.userId?._id || m.userId;
    return uid && uid.toString() === req.user._id.toString();
  });
  if (!requester) throw new AppError('Not authorized', 403);

  // Get pending invites
  const pendingInvites = await Invite.find({ 
    workspaceId, 
    expiresAt: { $gt: Date.now() } 
  }).select('email role invitedBy expiresAt createdAt').populate('invitedBy', 'name email');

  // Format members
  const members = workspace.members
    .filter(m => m.userId && (m.userId._id || m.userId))
    .map(m => {
      const u = m.userId._id ? m.userId : { _id: m.userId };
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        role: m.role,
        joinedAt: m.joinedAt,
        status: 'active',
      };
    });

  // Format pending invites
  const invites = pendingInvites.map(invite => ({
    _id: invite._id,
    email: invite.email,
    role: invite.role,
    invitedBy: invite.invitedBy,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
    status: 'pending',
  }));

  res.status(200).json({
    success: true,
    data: {
      members,
      invites,
    }
  });
});

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

  // Prevent multiple admins: check if workspace already has an admin (member or pending invite)
  if (targetRole === 'admin') {
    const existingAdminMember = workspace.members.some(m => m.role === 'admin');
    if (existingAdminMember) {
      throw new AppError('This workspace already has an admin. Only one admin is allowed per workspace.', 400);
    }
    
    const existingAdminInvite = await Invite.findOne({ workspaceId, role: 'admin', expiresAt: { $gt: Date.now() } });
    if (existingAdminInvite) {
      throw new AppError('An admin invite is already pending for this workspace.', 400);
    }
  }

  // Check if user is already a member
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const isAlreadyMember = workspace.members.some(m => m.userId.toString() === existingUser._id.toString());
    if (isAlreadyMember) throw new AppError('User is already a member', 400);

    // Prevent one person from being in multiple workspaces of the same company
    await assertNoCrossWorkspaceMembership({
      companyId: workspace.companyId,
      userId: existingUser._id,
      excludeWorkspaceId: workspace._id,
    });
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

  const inviteLink = `${(process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '')}/accept-invite/${rawToken}`;

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

  // Prevent one person from being in multiple workspaces of the same company
  await assertNoCrossWorkspaceMembership({
    companyId: workspace.companyId,
    userId: userToAdd._id,
    excludeWorkspaceId: workspace._id,
  });

  workspace.members.push({
    userId: userToAdd._id,
    role: role || 'member'
  });

  await workspace.save();

  // Clear any pending invite for this email so it doesn't linger after they've joined
  await Invite.deleteOne({ workspaceId, email: userToAdd.email });

  res.status(200).json({ success: true, message: 'Member added successfully', data: workspace });
});

// @desc    Revoke a pending invite
// @route   DELETE /api/workspaces/:workspaceId/invites/:inviteId
// @access  Private (Owner/Admin)
export const deleteInvite = asyncHandler(async (req, res) => {
  const { workspaceId, inviteId } = req.params;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const requester = workspace.members.find(m => m.userId.toString() === req.user._id.toString());
  if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
    throw new AppError('Not authorized', 403);
  }

  const invite = await Invite.findOne({ _id: inviteId, workspaceId });
  if (!invite) throw new AppError('Invite not found or already used', 404);

  await Invite.findByIdAndDelete(invite._id);

  res.status(200).json({ success: true, message: 'Invite revoked successfully' });
});

// @desc    Remove a member/admin from the workspace
// @route   DELETE /api/workspaces/:workspaceId/members/:userId
// @access  Private (Owner can remove members/admins, Admin can remove members)
export const removeMember = asyncHandler(async (req, res) => {
  const { workspaceId, userId } = req.params;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const requester = workspace.members.find(m => m.userId.toString() === req.user._id.toString());
  if (!requester) throw new AppError('Not authorized', 403);

  const target = workspace.members.find(m => m.userId.toString() === userId.toString());
  if (!target) throw new AppError('User is not a member of this workspace', 404);

  if (target.role === 'owner') {
    throw new AppError('The workspace owner cannot be removed', 400);
  }
  if (userId.toString() === req.user._id.toString()) {
    throw new AppError('You cannot remove yourself from the workspace', 400);
  }
  if (requester.role === 'admin' && target.role !== 'member') {
    throw new AppError('Admins can only remove Members', 403);
  }

  // Unassign any tasks assigned to the removed user
  await Task.updateMany({ workspaceId, assignedTo: userId }, { $set: { assignedTo: null } });

  workspace.members = workspace.members.filter(m => m.userId.toString() !== userId.toString());
  await workspace.save();

  const removedUser = await User.findById(userId).select('name email');
  if (removedUser?.email) {
    await taskQueue.add('sendMemberRemoved', {
      email: removedUser.email,
      workspaceName: workspace.name,
    });
  }

  res.status(200).json({ success: true, message: 'Member removed successfully' });
});

// @desc    Delete a workspace (Owner only)
// @route   DELETE /api/workspaces/:workspaceId
// @access  Private (Owner)
export const deleteWorkspace = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;

  const workspace = await Workspace.findById(workspaceId).populate('members.userId', 'name email');
  if (!workspace) throw new AppError('Workspace not found', 404);

  const requester = workspace.members.find(m => m.userId.toString() === req.user._id.toString());
  if (!requester || requester.role !== 'owner') {
    throw new AppError('Only the workspace owner can delete the workspace', 403);
  }

  // Notify the rest of the team before deletion
  for (const m of workspace.members) {
    const u = m.userId;
    if (u && u._id && u._id.toString() !== req.user._id.toString() && u.email) {
      await taskQueue.add('sendWorkspaceDeleted', {
        email: u.email,
        workspaceName: workspace.name,
      });
    }
  }

  await Task.deleteMany({ workspaceId });
  await Invite.deleteMany({ workspaceId });
  await Workspace.findByIdAndDelete(workspaceId);

  res.status(200).json({ success: true, message: 'Workspace deleted successfully' });
});
