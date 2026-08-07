import companyRepository from '../repositories/companyRepository.js';
import AppError from '../utils/AppError.js';
import { taskQueue } from '../config/queue.js';

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

  async deleteCompany(companyId, userId) {
    const company = await this.getCompany(companyId, userId);
    const workspaces = await companyRepository.getWorkspacesWithMembers(company._id);
    const workspaceIds = workspaces.map((ws) => ws._id);

    // Send a thank-you email to every person across the company (except the owner)
    const emailSet = new Set();
    workspaces.forEach((ws) => {
      ws.members.forEach((m) => {
        const u = m.userId;
        if (u && u._id && u._id.toString() !== userId.toString() && u.email) {
          emailSet.add(u.email);
        }
      });
    });

    for (const email of emailSet) {
      await taskQueue.add('sendCompanyDeleted', {
        email,
        companyName: company.name,
      });
    }

    await companyRepository.deleteCompanyData({
      companyId: company._id,
      workspaceIds,
    });

    return { companyId: company._id };
  }
}

export default new CompanyService();
