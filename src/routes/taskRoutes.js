import express from 'express';
import { getTasks, createTask, updateTaskStatus, approveTask, deleteTask, assignTask, rejectTask } from '../controllers/taskController.js';
import { protect } from '../middleware/protect.js';

// Merge params to access workspaceId from parent router
const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

router.put('/:taskId/status', protect, updateTaskStatus);
router.put('/:taskId/approve', protect, approveTask);
router.put('/:taskId/reject', protect, rejectTask);
router.put('/:taskId/assign', protect, assignTask);
router.delete('/:taskId', protect, deleteTask);

export default router;
