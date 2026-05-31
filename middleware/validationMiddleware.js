import { body, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }
  next();
};

const allowedEventStatuses = ['upcoming', 'ongoing', 'completed'];
const allowedEventVisibility = ['draft', 'published', 'completed', 'hidden'];
const allowedInquiryStatuses = ['new', 'contacted', 'confirmed', 'completed', 'cancelled'];
const allowedReviewStatuses = ['pending', 'published', 'rejected', 'hidden'];

const toBooleanValidator = () => body().custom((value) => typeof value === 'boolean' || value === 'true' || value === 'false');

export const validateFeedback = [
  body('eventId').isMongoId().withMessage('Invalid event ID'),
  body('customerName').trim().notEmpty().withMessage('Name is required').isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),
  body('customerEmail').optional({ checkFalsy: true }).trim().isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('customerPhone').optional({ checkFalsy: true }).trim().isLength({ min: 7, max: 40 }).withMessage('Invalid phone number'),
  body('message').trim().notEmpty().withMessage('Description is required').isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('token').optional({ checkFalsy: true }).isString(),
];

export const validateInquiry = [
  body('name').trim().notEmpty().withMessage('Customer name is required').isLength({ min: 2, max: 120 }).withMessage('Customer name must be between 2 and 120 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required').isLength({ min: 7, max: 40 }).withMessage('Phone number must be between 7 and 40 characters'),
  body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('eventType').trim().notEmpty().withMessage('Event type is required').isLength({ min: 2, max: 120 }).withMessage('Event type must be between 2 and 120 characters'),
  body('eventDate').isISO8601().withMessage('Invalid event date'),
  body('location').trim().notEmpty().withMessage('Location is required').isLength({ min: 2, max: 200 }).withMessage('Location must be between 2 and 200 characters'),
  body('guestCount').optional({ checkFalsy: true }).isLength({ max: 50 }).withMessage('Guest count must be 50 characters or less'),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters'),
  body('budgetRange').optional({ checkFalsy: true }).isLength({ max: 120 }).withMessage('Budget range must be 120 characters or less'),
  body('preferredContactMethod').optional().isIn(['whatsapp', 'phone', 'email']).withMessage('Invalid preferred contact method'),
];

export const validateEvent = [
  body('name').trim().notEmpty().withMessage('Event name is required').isLength({ min: 3, max: 100 }).withMessage('Event name must be between 3 and 100 characters'),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('location').trim().notEmpty().withMessage('Location is required').isLength({ min: 2, max: 120 }).withMessage('Location must be between 2 and 120 characters'),
  body('status').optional().isIn(allowedEventStatuses).withMessage('Invalid event status'),
  body('visibility').optional().isIn(allowedEventVisibility).withMessage('Invalid event visibility'),
  body('category').optional().trim().isLength({ max: 120 }).withMessage('Category must be 120 characters or less'),
];

export const validateEventUpdate = [
  body('name').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Event name must be between 3 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('location').optional().trim().isLength({ min: 2, max: 120 }).withMessage('Location must be between 2 and 120 characters'),
  body('status').optional().isIn(allowedEventStatuses).withMessage('Invalid event status'),
  body('visibility').optional().isIn(allowedEventVisibility).withMessage('Invalid event visibility'),
  body('category').optional().trim().isLength({ max: 120 }).withMessage('Category must be 120 characters or less'),
];

export const validateLogin = [
  body('email').trim().isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

export const validateFeedbackUpdate = [
  body('customerName').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),
  body('customerEmail').optional({ checkFalsy: true }).trim().isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('customerPhone').optional({ checkFalsy: true }).trim().isLength({ min: 7, max: 40 }).withMessage('Invalid phone number'),
  body('message').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('rating').optional().isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('status').optional().isIn(allowedReviewStatuses).withMessage('Invalid review status'),
];

export const validatePagination = [
  body('page').optional().isInt({ min: 1, max: 1000 }).withMessage('page must be a positive integer'),
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

export const validateIdParam = [
  body('id').optional(),
];

export default validateRequest;
