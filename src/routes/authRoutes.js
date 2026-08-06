import express from 'express';
import { registerUser, loginUser, logoutUser, refreshToken, getInvite, registerInvited } from '../controllers/authController.js';
import validate from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';

const router = express.Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/logout', logoutUser);
router.post('/refresh-token', refreshToken);

router.get('/invites/:token', getInvite);
router.post('/register-invited', registerInvited);

export default router;
