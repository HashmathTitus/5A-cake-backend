import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, getProfile } from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';
import { validateLogin, validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: { success: false, message: 'Too many login attempts, please try again later' },
});

router.post('/login', loginLimiter, validateLogin, validateRequest, login);

router.get('/profile', protect, getProfile);

export default router;
