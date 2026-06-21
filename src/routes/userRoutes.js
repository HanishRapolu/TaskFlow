import express from 'express';
import { getUserWorkspaces } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me/workspaces', protect, getUserWorkspaces);

export default router;
