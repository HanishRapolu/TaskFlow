import Task from '../models/Task.js';

class TaskRepository {
  async createTask(taskData) {
    const task = new Task(taskData);
    return await task.save();
  }

  async getTasksByBoardAndList(listId) {
    return await Task.find({ listId }).populate('assignees', 'name avatar email');
  }
}

export default new TaskRepository();
