import express from 'express';
import { createBoard, getBoards } from '../controllers/boardController.js';
import { protect } from '../middleware/protect.js';
import authorizeWorkspace from '../middleware/authorizeWorkspace.js';

// The router needs to merge params if nested under another router
const router = express.Router({ mergeParams: true });

// POST /api/workspaces/:workspaceId/boards (Admin/Owner only)
router.post('/', protect, authorizeWorkspace('admin', 'owner'), createBoard);

// GET /api/workspaces/:workspaceId/boards (All members)
router.get('/', protect, authorizeWorkspace('member', 'admin', 'owner'), getBoards);

export default router;
