import Workspace from '../models/Workspace.js';
import AppError from './AppError.js';

// A person may belong to only ONE workspace per company as a member or admin.
// Owners are exempt because the owner creates and belongs to every workspace they own in the company.
export const assertNoCrossWorkspaceMembership = async ({ companyId, userId, excludeWorkspaceId }) => {
  if (!companyId) return;

  const otherWorkspace = await Workspace.findOne({
    companyId,
    _id: { $ne: excludeWorkspaceId },
    members: { $elemMatch: { userId, role: { $in: ['admin', 'member'] } } },
  });

  if (otherWorkspace) {
    throw new AppError(
      `This person is already on the team of "${otherWorkspace.name}". Each person can belong to only one workspace per company.`,
      400
    );
  }
};
