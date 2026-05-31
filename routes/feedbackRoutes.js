import express from 'express';
import {
  getAllFeedback,
  getPublicFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getFeedbackStats,
  validateFeedbackLink,
  submitFeedback,
} from '../controllers/feedbackController.js';
import protect, { authorizeRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { validateFeedback, validateFeedbackUpdate, validateRequest } from '../middleware/validationMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const feedbackSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.get('/public/list', getPublicFeedback);
router.get('/public', getPublicFeedback);
router.get('/public/:id', getFeedbackById);
router.get('/validate/:eventId/:token', validateFeedbackLink);
router.post('/submit/:eventId/:token', feedbackSubmitLimiter, upload.array('images', 3), (req, res, next) => {
  req.body.eventId = req.params.eventId;
  req.body.token = req.params.token;
  next();
}, validateFeedback, validateRequest, submitFeedback);
router.post('/public/create', createFeedback);

// Admin routes
router.get('/admin/list', protect, authorizeRoles('admin', 'superadmin'), getAllFeedback);
router.get('/admin', protect, authorizeRoles('admin', 'superadmin'), getAllFeedback);
router.put('/admin/:id', protect, authorizeRoles('admin', 'superadmin'), upload.array('images', 3), validateFeedbackUpdate, validateRequest, updateFeedback);
router.delete('/admin/:id', protect, authorizeRoles('admin', 'superadmin'), deleteFeedback);
router.get('/admin/stats/overview', protect, authorizeRoles('admin', 'superadmin'), getFeedbackStats);

export default router;
