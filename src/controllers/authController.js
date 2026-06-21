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
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
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

  res.json({
    email: invite.email,
    workspaceName: invite.workspaceId.name,
    role: invite.role
  });
});

export const registerInvited = asyncHandler(async (req, res) => {
  const { name, password, token } = req.body;
  if (!name || !password || !token) throw new AppError('Please provide all fields', 400);

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const invite = await Invite.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() }
  });

  if (!invite) throw new AppError('Invite link is invalid or has expired', 400);

  // Check if user already exists with this email (they shouldn't, but just in case)
  const existingUser = await User.findOne({ email: invite.email });
  if (existingUser) throw new AppError('User already exists. Please login.', 400);

  // Create the User (without a default workspace)
  const user = await User.create({
    name,
    email: invite.email,
    password
  });

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
