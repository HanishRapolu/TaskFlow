import express from 'express';
import {
  getMyCompany,
  getCompany,
  createCompany,
  getCompanyWorkspaces,
  createWorkspace,
} from '../controllers/companyController.js';
import { protect } from '../middleware/protect.js';
import authorizeCompany from '../middleware/authorizeCompany.js';

const router = express.Router();

router.post('/', protect, createCompany);
router.get('/me', protect, getMyCompany);
router.get('/:companyId', protect, getCompany);
router.get('/:companyId/workspaces', protect, authorizeCompany(), getCompanyWorkspaces);
router.post('/:companyId/workspaces', protect, authorizeCompany(), createWorkspace);

export default router;
