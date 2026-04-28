import express from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';
import { validateLogin, validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', validateLogin, validateRequest, register);
router.post('/login', validateLogin, validateRequest, login);

// Protected routes
router.get('/profile', protect, getProfile);

export default router;
