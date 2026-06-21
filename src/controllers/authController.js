import asyncHandler from 'express-async-handler';
import authService from '../services/authService.js';

const setRefreshTokenCookie = (res, token) => {
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const registerUser = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(req.body);
  
  setRefreshTokenCookie(res, refreshToken);
  
  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    accessToken,
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const { user, accessToken, refreshToken } = await authService.loginUser(email, password);
  
  setRefreshTokenCookie(res, refreshToken);
  
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    accessToken,
  });
});

export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  
  res.status(200).json({ message: 'User logged out successfully' });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.jwt; // requires cookie-parser middleware in express
  
  const newAccessToken = await authService.refreshAccessToken(token);
  
  res.json({ accessToken: newAccessToken });
});

import crypto from 'crypto';
import Invite from '../models/Invite.js';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import jwt from 'jsonwebtoken';

// Generate Token helper for registerInvited (since authService.registerUser handles it for normal users, we'll need it here)
const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const getInvite = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const invite = await Invite.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() }
  }).populate('workspaceId', 'name');

  if (!invite) throw new AppError('Invite link is invalid or has expired', 400);

  const existingUser = await User.findOne({ email: invite.email });

  res.json({
    email: invite.email,
    workspaceName: invite.workspaceId.name,
    role: invite.role,
    userExists: !!existingUser
  });
});

export const registerInvited = asyncHandler(async (req, res) => {
  const { name, password, token } = req.body;
  if (!password || !token) throw new AppError('Please provide password and token', 400);

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const invite = await Invite.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() }
  });

  if (!invite) throw new AppError('Invite link is invalid or has expired', 400);

  let user = await User.findOne({ email: invite.email });
  
  if (user) {
    // User exists, verify their password to accept the invite
    const isMatch = await user.matchPassword(password);
    if (!isMatch) throw new AppError('Invalid password for existing account', 401);
  } else {
    // New user, require name
    if (!name) throw new AppError('Please provide your name', 400);
    user = await User.create({
      name,
      email: invite.email,
      password
    });
  }

  // Add to Workspace
  const workspace = await Workspace.findById(invite.workspaceId);
  if (workspace) {
    workspace.members.push({
      userId: user._id,
      role: invite.role
    });
    await workspace.save();
  }

  // Delete the invite so it can't be reused
  await Invite.findByIdAndDelete(invite._id);

  // Generate tokens and log them in
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
  setRefreshTokenCookie(res, newRefreshToken);

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    accessToken,
  });
});
