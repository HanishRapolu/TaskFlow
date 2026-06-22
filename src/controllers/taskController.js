import asyncHandler from 'express-async-handler';
import Task from '../models/Task.js';
import Workspace from '../models/Workspace.js';
import AppError from '../utils/AppError.js';

// Helper to get user's role in the workspace
const getUserRole = (workspace, userId) => {
  const member = workspace.members.find(m => m.userId.toString() === userId.toString());
  return member ? member.role : null;
};

// @desc    Get all tasks for a workspace
// @route   GET /api/workspaces/:workspaceId/tasks
// @access  Private (Workspace members)
export const getTasks = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);
  
  if (!getUserRole(workspace, req.user._id)) {
    throw new AppError('Not authorized to view tasks in this project', 403);
  }

  const tasks = await Task.find({ workspaceId }).populate('assignedTo', 'name email').populate('createdBy', 'name email').sort('-createdAt');
  res.json(tasks);
});

// @desc    Create a task
// @route   POST /api/workspaces/:workspaceId/tasks
// @access  Private
export const createTask = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { title, description, assignedTo } = req.body;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const role = getUserRole(workspace, req.user._id);
  if (!role) throw new AppError('Not authorized', 403);

  // If role is member, they can create a task but it needs approval.
  // Admins/Owners create pre-approved tasks.
  const isApproved = role === 'admin' || role === 'owner';

  // If a member is creating a task, they can't assign it to someone else unless approved?
  // Let's just create it.
  const task = await Task.create({
    title,
    description,
    assignedTo: assignedTo || null,
    createdBy: req.user._id,
    workspaceId,
    isApproved,
  });

  const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name email').populate('createdBy', 'name email');
  res.status(201).json(populatedTask);
});

// @desc    Update task status
// @route   PUT /api/workspaces/:workspaceId/tasks/:taskId/status
// @access  Private
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { workspaceId, taskId } = req.params;
  const { status } = req.body;

  const workspace = await Workspace.findById(workspaceId);
  const role = getUserRole(workspace, req.user._id);
  if (!role) throw new AppError('Not authorized', 403);

  const task = await Task.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);

  // You can only update status if you are admin/owner or if the task is assigned to you
  if (role !== 'admin' && role !== 'owner') {
    if (task.assignedTo?.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to update status of a task not assigned to you', 403);
    }
  }

  task.status = status;
  await task.save();

  const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name email').populate('createdBy', 'name email');
  res.json(populatedTask);
});

// @desc    Approve a task
// @route   PUT /api/workspaces/:workspaceId/tasks/:taskId/approve
// @access  Private (Admins/Owners)
export const approveTask = asyncHandler(async (req, res) => {
  const { workspaceId, taskId } = req.params;

  const workspace = await Workspace.findById(workspaceId);
  const role = getUserRole(workspace, req.user._id);
  if (role !== 'admin' && role !== 'owner') {
    throw new AppError('Only Admins or Owners can approve tasks', 403);
  }

  const task = await Task.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);

  task.isApproved = true;
  await task.save();

  const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name email').populate('createdBy', 'name email');
  res.json(populatedTask);
});

// @desc    Delete a task
// @route   DELETE /api/workspaces/:workspaceId/tasks/:taskId
// @access  Private (Admins/Owners)
export const deleteTask = asyncHandler(async (req, res) => {
  const { workspaceId, taskId } = req.params;

  const workspace = await Workspace.findById(workspaceId);
  const role = getUserRole(workspace, req.user._id);
  
  if (role !== 'admin' && role !== 'owner') {
    throw new AppError('Only Admins or Owners can delete tasks', 403);
  }

  const task = await Task.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);

  await Task.deleteOne({ _id: task._id });
  res.json({ success: true, message: 'Task deleted' });
});
