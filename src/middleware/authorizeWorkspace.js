import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import Workspace from '../models/Workspace.js';

const authorizeWorkspace = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    // Retrieve workspaceId from params or body
    const workspaceId = req.params.workspaceId || req.body.workspaceId;

    if (!workspaceId) {
      throw new AppError('Workspace ID is required for authorization', 400);
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    // Check if user is a member of the workspace
    const member = workspace.members.find(
      (m) => m.userId.toString() === req.user._id.toString()
    );

    if (!member) {
      throw new AppError('Not authorized to access this workspace', 403);
    }

    // Role verification if roles are passed
    if (roles.length > 0) {
      const roleHierarchy = { owner: 3, admin: 2, member: 1 };
      
      const userRoleLevel = roleHierarchy[member.role] || 0;
      
      // The required role level is the minimum level of the allowed roles
      const requiredRoleLevels = roles.map(r => roleHierarchy[r]).filter(level => level !== undefined);
      const requiredRoleLevel = Math.min(...requiredRoleLevels);

      if (userRoleLevel < requiredRoleLevel) {
        throw new AppError('Not authorized for this action in the workspace', 403);
      }
    }

    // Attach to request for controllers
    req.workspace = workspace;
    next();
  });
};

export default authorizeWorkspace;
