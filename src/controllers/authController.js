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
