import express from 'express';
import protect, { authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getAllInquiries,
  updateInquiryStatus,
  deleteInquiry,
  getInquiryStats,
} from '../controllers/inquiryController.js';

const router = express.Router();

router.use(protect, authorizeRoles('admin', 'superadmin'));
router.get('/', getAllInquiries);
router.get('/stats/overview', getInquiryStats);
router.put('/:id/status', updateInquiryStatus);
router.delete('/:id', deleteInquiry);

export default router;