import Workspace from '../models/Workspace.js';

class UserRepository {
  async getUserWorkspaces(userId) {
    const workspaces = await Workspace.find({
      'members.userId': userId
    });
    
    return workspaces.map(ws => {
      const member = ws.members.find(m => m.userId.toString() === userId.toString());
      return {
        workspaceId: ws._id,
        name: ws.name,
        role: member ? member.role : null,
        avatar: null // Avatar not in workspace schema currently
      };
    });
  }
}

export default new UserRepository();
