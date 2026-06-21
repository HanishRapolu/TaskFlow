import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import User from '../models/User.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'fallback_access_secret');

      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      throw new AppError('Not authorized, token failed or expired', 401);
    }
  }

  if (!token) {
    throw new AppError('Not authorized, no token provided', 401);
  }
});

export default protect;
