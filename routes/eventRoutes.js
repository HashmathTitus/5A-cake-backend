import express from 'express';
import {
  getAllEvents,
  getAdminEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats,
  generateFeedbackLink,
} from '../controllers/eventController.js';
import protect, { authorizeRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { validateEvent, validateEventUpdate, validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllEvents);
router.get('/public', getAllEvents);

// Admin routes
router.get('/stats/overview', protect, authorizeRoles('admin', 'superadmin'), getEventStats);
router.get('/admin/stats/overview', protect, authorizeRoles('admin', 'superadmin'), getEventStats);
router.get('/admin', protect, authorizeRoles('admin', 'superadmin'), getAdminEvents);
router.post('/:id/feedback-link', protect, authorizeRoles('admin', 'superadmin'), generateFeedbackLink);
router.get('/:id', getEventById);
router.post('/', protect, authorizeRoles('admin', 'superadmin'), upload.array('images', 5), validateEvent, validateRequest, createEvent);
router.put('/:id', protect, authorizeRoles('admin', 'superadmin'), upload.array('images', 5), validateEventUpdate, validateRequest, updateEvent);
router.delete('/:id', protect, authorizeRoles('admin', 'superadmin'), deleteEvent);

export default router;
