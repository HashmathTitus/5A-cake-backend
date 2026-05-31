import express from 'express';
import rateLimit from 'express-rate-limit';
import upload from '../middleware/uploadMiddleware.js';
import { validateInquiry, validateRequest } from '../middleware/validationMiddleware.js';
import { createInquiry } from '../controllers/inquiryController.js';

const router = express.Router();

const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', inquiryLimiter, upload.array('referenceImages', 3), validateInquiry, validateRequest, createInquiry);

export default router;