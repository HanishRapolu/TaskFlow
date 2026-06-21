import express from 'express';
import { createTask } from '../controllers/taskController.js';
import { protect } from '../middleware/protect.js';
import authorizeWorkspace from '../middleware/authorizeWorkspace.js';

const router = express.Router({ mergeParams: true });

// POST /api/workspaces/:workspaceId/boards/:boardId/tasks (All members)
// Assumes body contains listId, title, etc.
router.post('/', protect, authorizeWorkspace('member', 'admin', 'owner'), createTask);

export default router;
