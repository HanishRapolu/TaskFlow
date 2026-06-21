import asyncHandler from 'express-async-handler';
import userService from '../services/userService.js';

export const getUserWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await userService.getUserWorkspaces(req.user._id);
  res.json(workspaces);
});
