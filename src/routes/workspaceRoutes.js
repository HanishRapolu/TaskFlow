import express from 'express';
import {
  inviteMember,
  addMember,
  getWorkspace,
  getWorkspaceMembers,
  removeMember,
  deleteWorkspace,
  deleteInvite,
} from '../controllers/workspaceController.js';
import { protect } from '../middleware/protect.js';
import authorizeWorkspace from '../middleware/authorizeWorkspace.js';

const router = express.Router();

// Route to get workspace details (must be a member)
router.get('/:workspaceId', protect, getWorkspace);

// Route to get workspace members and pending invites
router.get('/:workspaceId/members', protect, getWorkspaceMembers);

// Route for adding an existing user directly to a workspace
router.post('/:workspaceId/members', protect, authorizeWorkspace('owner', 'admin'), addMember);

// Route for removing a member/admin from a workspace
router.delete('/:workspaceId/members/:userId', protect, authorizeWorkspace('owner', 'admin'), removeMember);

// Route for sending a secure email invite
router.post('/:workspaceId/invite', protect, authorizeWorkspace('owner', 'admin'), inviteMember);

// Route for revoking a pending invite
router.delete('/:workspaceId/invites/:inviteId', protect, authorizeWorkspace('owner', 'admin'), deleteInvite);

// Route for deleting a workspace (Owner only)
router.delete('/:workspaceId', protect, authorizeWorkspace('owner'), deleteWorkspace);

export default router;
