import Company from '../models/Company.js';
import Workspace from '../models/Workspace.js';

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
