import companyRepository from '../repositories/companyRepository.js';
import AppError from '../utils/AppError.js';

class CompanyService {
  async getMyCompany(userId) {
    const company = await companyRepository.findByOwner(userId);
    if (!company) {
      throw new AppError('You do not own a company yet', 404);
    }
    return company;
  }

  async getCompany(companyId, userId) {
    const company = await companyRepository.findById(companyId);
    if (!company) {
      throw new AppError('Company not found', 404);
    }
    if (company.owner.toString() !== userId.toString()) {
      throw new AppError('Not authorized to access this company', 403);
    }
    return company;
  }

  async createCompany(data, userId) {
    if (!data.name) {
      throw new AppError('Company name is required', 400);
    }

    const existing = await companyRepository.findByOwner(userId);
    if (existing) {
      throw new AppError('You already own a company', 400);
    }

    return await companyRepository.createCompany({
      name: data.name,
      description: data.description,
      ownerId: userId,
    });
  }

  async getCompanyWorkspaces(companyId, userId) {
    const company = await this.getCompany(companyId, userId);
    const workspaces = await companyRepository.getWorkspaces(company._id);
    return workspaces.map((ws) => {
      const member = ws.members.find((m) => m.userId.toString() === userId.toString());
      return {
        workspaceId: ws._id,
        name: ws.name,
        description: ws.description,
        role: member ? member.role : null,
      };
    });
  }

  async createWorkspace(companyId, data, userId) {
    if (!data.name) {
      throw new AppError('Workspace name is required', 400);
    }

    const company = await this.getCompany(companyId, userId);

    return await companyRepository.createWorkspace(company._id, {
      name: data.name,
      description: data.description,
      ownerId: userId,
    });
  }
}

export default new CompanyService();
