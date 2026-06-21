import express from 'express';
import { registerUser, loginUser, logoutUser, refreshToken, getInvite, registerInvited } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/refresh-token', refreshToken);

router.get('/invites/:token', getInvite);
router.post('/register-invited', registerInvited);

export default router;
