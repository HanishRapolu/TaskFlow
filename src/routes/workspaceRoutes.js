import express from 'express';
import { inviteMember, addMember, getWorkspace } from '../controllers/workspaceController.js';
import { protect } from '../middleware/protect.js';
import authorizeWorkspace from '../middleware/authorizeWorkspace.js';

const router = express.Router();

// Route to get workspace details (must be a member)
router.get('/:workspaceId', protect, getWorkspace);

// Route for adding an existing user directly to a workspace
router.post('/:workspaceId/members', protect, authorizeWorkspace('owner', 'admin'), addMember);

// Route for sending a secure email invite
router.post('/:workspaceId/invite', protect, authorizeWorkspace('owner', 'admin'), inviteMember);

export default router;
