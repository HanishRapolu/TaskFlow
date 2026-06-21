import taskRepository from '../repositories/taskRepository.js';
import AppError from '../utils/AppError.js';

class TaskService {
  async createTask(workspaceId, boardId, listId, taskData, workspace) {
    if (!taskData.title) {
      throw new AppError('Task title is required', 400);
    }

    // Security Check: Cross-tenant assignee prevention
    if (taskData.assignees && taskData.assignees.length > 0) {
      // Validate all assignees are actually members of the workspace
      const workspaceMemberIds = workspace.members.map(m => m.userId.toString());
      
      const invalidAssignees = taskData.assignees.filter(
        assigneeId => !workspaceMemberIds.includes(assigneeId.toString())
      );

      if (invalidAssignees.length > 0) {
        throw new AppError('One or more assignees do not belong to this workspace', 403);
      }
    }

    return await taskRepository.createTask({
      ...taskData,
      listId,
      workspaceId,
    });
  }
}

export default new TaskService();
