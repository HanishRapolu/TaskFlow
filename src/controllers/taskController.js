import asyncHandler from 'express-async-handler';
import Task from '../models/Task.js';
import Workspace from '../models/Workspace.js';
import AppError from '../utils/AppError.js';

// Helper to get user's role in the workspace
const getUserRole = (workspace, userId) => {
  const member = workspace.members.find(m => m.userId.toString() === userId.toString());
  return member ? member.role : null;
};

// Helper to check if target user is in workspace and get their role
const getTargetUserRole = (workspace, targetUserId) => {
  const member = workspace.members.find(m => m.userId.toString() === targetUserId.toString());
  return member ? member.role : null;
};

// @desc    Assign/Reassign a task
// @route   PUT /api/workspaces/:workspaceId/tasks/:taskId/assign
// @access  Private
export const assignTask = asyncHandler(async (req, res) => {
  const { workspaceId, taskId } = req.params;
  const { assignedTo } = req.body; // can be null to unassign

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const requesterRole = getUserRole(workspace, req.user._id);
  if (!requesterRole) throw new AppError('Not authorized', 403);

  const task = await Task.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);

  if (task.workspaceId.toString() !== workspaceId) {
    throw new AppError('Task does not belong to this workspace', 400);
  }

  // If unassigning (assignedTo is null), allow if user has permission to modify task
  if (!assignedTo) {
    if (requesterRole !== 'admin' && requesterRole !== 'owner') {
      if (task.assignedTo?.toString() !== req.user._id.toString()) {
        throw new AppError('Not authorized to unassign this task', 403);
      }
    }
    task.assignedTo = null;
    task.isApproved = true;
    await task.save();
    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name email').populate('createdBy', 'name email');
    return res.json(populatedTask);
  }

  // Check if target user is in workspace
  const targetRole = getTargetUserRole(workspace, assignedTo);
  if (!targetRole) {
    throw new AppError('Target user is not a member of this workspace', 400);
  }

  // Role-based assignment rules
  let requiresApproval = false;

  if (requesterRole === 'owner') {
    // Owner can assign to anyone (owner, admin, member)
    // No approval needed
  } else if (requesterRole === 'admin') {
    // Admin can assign to self and members, NOT owner
    if (targetRole === 'owner') {
      throw new AppError('Admins cannot assign tasks to the workspace owner', 403);
    }
    // Admin assigning to member or self - no approval needed
  } else if (requesterRole === 'member') {
    // Member can assign to self and other members
    // But assigning to another member requires approval
    if (targetRole === 'owner' || targetRole === 'admin') {
      throw new AppError('Members cannot assign tasks to admins or owners', 403);
    }
    if (assignedTo.toString() !== req.user._id.toString()) {
      // Assigning to another member - requires approval
      requiresApproval = true;
    }
    // Assigning to self - no approval needed
  }

    task.assignedTo = assignedTo;
    task.isApproved = !requiresApproval;
    await task.save();

  const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name email').populate('createdBy', 'name email');
  res.json(populatedTask);
});

// @desc    Get all tasks for a workspace
// @route   GET /api/workspaces/:workspaceId/tasks
// @access  Private (Workspace members)
export const getTasks = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);
  
  const requesterRole = getUserRole(workspace, req.user._id);
  if (!requesterRole) {
    throw new AppError('Not authorized to view tasks in this project', 403);
  }

  // Tasks awaiting approval are only visible to Admins and Owners.
  // Regular members only see tasks once they are approved.
  const query = { workspaceId };
  if (requesterRole === 'member') query.isApproved = true;

  const tasks = await Task.find(query).populate('assignedTo', 'name email').populate('createdBy', 'name email').sort('-createdAt');
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

  // Validate assignment rules at creation time
  let isApproved = true;
  let requiresApproval = false;

  if (assignedTo) {
    const targetRole = getTargetUserRole(workspace, assignedTo);
    if (!targetRole) {
      throw new AppError('Target user is not a member of this workspace', 400);
    }

    if (role === 'owner') {
      // Owner can assign to anyone - no approval needed
    } else if (role === 'admin') {
      // Admin can assign to self and members, NOT owner
      if (targetRole === 'owner') {
        throw new AppError('Admins cannot assign tasks to the workspace owner', 403);
      }
    } else if (role === 'member') {
      // Member can assign to self and other members
      if (targetRole === 'owner' || targetRole === 'admin') {
        throw new AppError('Members cannot assign tasks to admins or owners', 403);
      }
      if (assignedTo.toString() !== req.user._id.toString()) {
        // Assigning to another member - requires approval
        requiresApproval = true;
      }
    }
    isApproved = !requiresApproval;
  } else {
    // No assignment - member-created tasks need approval by default
    if (role === 'member') {
      isApproved = false;
    }
  }

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

// @desc    Reject a task assignment
// @route   PUT /api/workspaces/:workspaceId/tasks/:taskId/reject
// @access  Private (Admins/Owners)
export const rejectTask = asyncHandler(async (req, res) => {
  const { workspaceId, taskId } = req.params;

  const workspace = await Workspace.findById(workspaceId);
  const role = getUserRole(workspace, req.user._id);
  if (role !== 'admin' && role !== 'owner') {
    throw new AppError('Only Admins or Owners can reject tasks', 403);
  }

  const task = await Task.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);

  await Task.deleteOne({ _id: task._id });

  res.json({ success: true, message: 'Task rejected and deleted' });
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
