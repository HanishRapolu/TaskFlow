import Workspace from '../models/Workspace.js';
import Company from '../models/Company.js';

class UserRepository {
  async getUserWorkspaces(userId) {
    const ownedCompanies = await Company.find({ owner: userId }).select('_id');
    const ownedCompanyIds = ownedCompanies.map((c) => c._id);

    const [companies, workspaces] = await Promise.all([
      Company.find({ owner: userId }).select('name description'),
      Workspace.find({
        members: {
          $elemMatch: {
            userId,
            role: { $in: ['admin', 'member'] },
          },
        },
        companyId: { $nin: ownedCompanyIds },
      }),
    ]);

    return {
      companies: companies.map((c) => ({
        companyId: c._id,
        name: c.name,
        description: c.description,
        role: 'owner',
      })),
      workspaces: workspaces.map((ws) => {
        const member = ws.members.find((m) => m.userId.toString() === userId.toString());
        return {
          workspaceId: ws._id,
          name: ws.name,
          role: member ? member.role : null,
          avatar: null,
        };
      }),
    };
  }
}

export default new UserRepository();
