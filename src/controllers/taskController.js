import asyncHandler from 'express-async-handler';
import taskService from '../services/taskService.js';
import { getIo } from '../config/socket.js';

export const createTask = asyncHandler(async (req, res) => {
  const { workspaceId, boardId } = req.params;
  
  // List ID could be in params or body
  const targetListId = req.params.listId || req.body.listId;

  if (!targetListId) {
     res.status(400);
     throw new Error('List ID is required to create a task');
  }

  // Pass req.workspace down to the service for assignee validation
  const task = await taskService.createTask(
    workspaceId, 
    boardId, 
    targetListId, 
    req.body, 
    req.workspace
  );
  
  // Emit socket event to all clients in the board room
  getIo().to(`board:${boardId}`).emit('task:created', task);
  
  res.status(201).json(task);
});

// Example of other potential endpoints that would emit events:
export const moveTask = asyncHandler(async (req, res) => {
  // Implementation of moving task...
  // getIo().to(`board:${boardId}`).emit('task:moved', updatedTask);
});
