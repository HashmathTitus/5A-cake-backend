import express from 'express';
import {
  getAllFeedback,
  getPublicFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getFeedbackStats,
} from '../controllers/feedbackController.js';
import protect from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { validateFeedback, validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes
router.get('/public/list', getPublicFeedback);
router.get('/public/:id', getFeedbackById);
router.post('/public/create', upload.array('images', 10), validateFeedback, validateRequest, createFeedback);

// Admin routes
router.get('/admin/list', protect, getAllFeedback);
router.put('/admin/:id', protect, upload.array('images', 10), updateFeedback);
router.delete('/admin/:id', protect, deleteFeedback);
router.get('/admin/stats/overview', protect, getFeedbackStats);

export default router;
