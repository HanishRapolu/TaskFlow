import Company from '../models/Company.js';
import Workspace from '../models/Workspace.js';
import Task from '../models/Task.js';
import Invite from '../models/Invite.js';

class CompanyRepository {
  async findByOwner(ownerId) {
    return await Company.findOne({ owner: ownerId });
  }

  async findById(companyId) {
    return await Company.findById(companyId);
  }

  async createCompany({ name, description, ownerId }) {
    const company = new Company({
      name,
      description: description || '',
      owner: ownerId,
    });
    return await company.save();
  }

  async getWorkspaces(companyId) {
    return await Workspace.find({ companyId });
  }

  async getWorkspacesWithMembers(companyId) {
    return await Workspace.find({ companyId }).populate('members.userId', 'name email');
  }

  async deleteCompanyData({ companyId, workspaceIds }) {
    await Task.deleteMany({ workspaceId: { $in: workspaceIds } });
    await Invite.deleteMany({ workspaceId: { $in: workspaceIds } });
    await Workspace.deleteMany({ _id: { $in: workspaceIds } });
    await Company.findByIdAndDelete(companyId);
  }

  async createWorkspace(companyId, { name, description, ownerId }) {
    const workspace = new Workspace({
      name,
      description: description || '',
      owner: ownerId,
      companyId,
      members: [{
        userId: ownerId,
        role: 'owner',
      }],
    });
    return await workspace.save();
  }
}

export default new CompanyRepository();
