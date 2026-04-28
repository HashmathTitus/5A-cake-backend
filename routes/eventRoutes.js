import express from 'express';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats,
} from '../controllers/eventController.js';
import protect from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { validateEvent, validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllEvents);
router.get('/stats/overview', protect, getEventStats);
router.get('/:id', getEventById);

// Admin routes
router.post('/', protect, upload.array('images', 5), validateEvent, validateRequest, createEvent);
router.put('/:id', protect, upload.array('images', 5), updateEvent);
router.delete('/:id', protect, deleteEvent);

export default router;
