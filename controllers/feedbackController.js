import fs from 'fs/promises';
import path from 'path';
import Event from '../models/Event.js';
import Feedback from '../models/Feedback.js';
import FeedbackToken from '../models/FeedbackToken.js';
import { recalculateEventStats } from '../services/eventStatsService.js';
import { mapImageUrls, mapUploadedFiles, normalizeStoredImage } from '../utils/fileUtils.js';

const serializeFeedback = (feedback) => {
  if (!feedback) {
    return null;
  }

  const plain = feedback.toObject ? feedback.toObject() : feedback;

  return {
    ...plain,
    images: mapImageUrls(plain.images || []),
  };
};

const serializeReviewEvent = (event) => {
  if (!event) {
    return null;
  }

  const plain = event.toObject ? event.toObject() : event;

  return {
    _id: plain._id,
    name: plain.name,
    date: plain.date,
    location: plain.location,
    category: plain.category,
    coverImage: plain.coverImage,
    visibility: plain.visibility,
    status: plain.status,
  };
};

const isEventEligibleForReviews = (event) => Boolean(event) && (event.status === 'completed' || event.visibility === 'completed');

const deleteStoredImages = async (images = []) => {
  const normalizedImages = images.map(normalizeStoredImage).filter(Boolean);
  const cloudinaryPublicIds = normalizedImages.map((image) => image.publicId).filter(Boolean);
  const localFilenames = normalizedImages
    .map((image) => {
      try {
        const parsedUrl = new URL(image.url);
        return path.basename(parsedUrl.pathname);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);

  if (cloudinaryPublicIds.length && process.env.CLOUDINARY_CLOUD_NAME) {
    const { v2: cloudinary } = await import('cloudinary');
    await Promise.all(cloudinaryPublicIds.map((publicId) => cloudinary.uploader.destroy(publicId, { invalidate: true })));
  }

  if (localFilenames.length) {
    await Promise.all(
      localFilenames.map(async (filename) => {
        const filePath = path.resolve('uploads', filename);
        try {
          await fs.unlink(filePath);
        } catch (error) {
          return null;
        }
        return null;
      })
    );
  }
};

export const getAllFeedback = async (req, res) => {
  try {
    const { eventId, rating, status, search = '', page = 1, limit = 10 } = req.query;
    const query = {};

    if (eventId) query.eventId = eventId;
    if (rating) query.rating = Number(rating);
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const [feedbacks, total] = await Promise.all([
      Feedback.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
      Feedback.countDocuments(query),
    ]);

    const serializedFeedback = feedbacks.map(serializeFeedback);
    const pagination = {
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
    };

    res.json({
      success: true,
      message: 'Feedback fetched successfully',
      data: { feedbacks: serializedFeedback, pagination },
      feedbacks: serializedFeedback,
      pagination,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPublicFeedback = async (req, res) => {
  try {
    const { eventId, page = 1, limit = 12 } = req.query;
    const query = { status: 'published' };

    if (eventId) query.eventId = eventId;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const [feedbacks, total] = await Promise.all([
      Feedback.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
      Feedback.countDocuments(query),
    ]);

    const serializedFeedback = feedbacks.map(serializeFeedback);
    const pagination = {
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
    };

    res.json({
      success: true,
      message: 'Public feedback fetched successfully',
      data: { feedbacks: serializedFeedback, pagination },
      feedbacks: serializedFeedback,
      pagination,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ _id: req.params.id, status: 'published' });

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    res.json({
      success: true,
      data: { feedback: serializeFeedback(feedback) },
      feedback: serializeFeedback(feedback),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const validateFeedbackLink = async (req, res) => {
  try {
    const { eventId, token } = req.params;
    const event = await Event.findById(eventId).select('name date location category coverImage visibility status');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const feedbackToken = await FeedbackToken.findOne({ eventId, token });

    if (!feedbackToken) {
      return res.status(404).json({ success: false, message: 'Feedback link not found' });
    }

    if (feedbackToken.isUsed) {
      return res.status(410).json({ success: false, message: 'This feedback link has already been used' });
    }

    if (feedbackToken.expiresAt && new Date(feedbackToken.expiresAt) < new Date()) {
      return res.status(410).json({ success: false, message: 'This feedback link has expired' });
    }

    if (!isEventEligibleForReviews(event)) {
      return res.status(400).json({ success: false, message: 'Feedback can only be collected for completed events' });
    }

    res.json({
      success: true,
      message: 'Feedback link is valid',
      data: { event: serializeReviewEvent(event) },
      event: serializeReviewEvent(event),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const submitFeedback = async (req, res) => {
  try {
    const { eventId, token } = req.params;
    const { customerName, customerEmail = '', customerPhone = '', message, rating } = req.body;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const feedbackToken = await FeedbackToken.findOne({ eventId, token });

    if (!feedbackToken) {
      return res.status(404).json({ success: false, message: 'Feedback link not found' });
    }

    if (feedbackToken.isUsed) {
      return res.status(410).json({ success: false, message: 'This feedback link has already been used' });
    }

    if (feedbackToken.expiresAt && new Date(feedbackToken.expiresAt) < new Date()) {
      return res.status(410).json({ success: false, message: 'This feedback link has expired' });
    }

    if (!isEventEligibleForReviews(event)) {
      return res.status(400).json({ success: false, message: 'Feedback can only be collected for completed events' });
    }

    if (req.files && req.files.length > 3) {
      return res.status(400).json({ success: false, message: 'Maximum 3 images are allowed for feedback' });
    }

    const feedback = await Feedback.create({
      eventId,
      customerName,
      customerEmail,
      customerPhone,
      message,
      rating: Number(rating),
      images: mapUploadedFiles(req, req.files),
      status: 'pending',
      token,
      tokenId: feedbackToken._id,
      submittedAt: new Date(),
    });

    feedbackToken.isUsed = true;
    feedbackToken.usedAt = new Date();
    await feedbackToken.save();
    await recalculateEventStats(eventId);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { feedback: serializeFeedback(feedback) },
      feedback: serializeFeedback(feedback),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createFeedback = async (req, res) => {
  res.status(403).json({
    success: false,
    message: 'Use a private feedback link to submit a review',
  });
};

export const updateFeedback = async (req, res) => {
  try {
    const existingFeedback = await Feedback.findById(req.params.id);

    if (!existingFeedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    const { customerName, customerEmail, customerPhone, message, rating, status } = req.body;
    const updateData = {
      ...(customerName !== undefined ? { customerName } : {}),
      ...(customerEmail !== undefined ? { customerEmail } : {}),
      ...(customerPhone !== undefined ? { customerPhone } : {}),
      ...(message !== undefined ? { message } : {}),
      ...(rating !== undefined ? { rating: Number(rating) } : {}),
      ...(status !== undefined ? { status } : {}),
    };

    if (req.files && req.files.length > 0) {
      if (req.files.length > 3) {
        return res.status(400).json({ success: false, message: 'Maximum 3 images are allowed for feedback' });
      }

      await deleteStoredImages(existingFeedback.images || []);
      updateData.images = mapUploadedFiles(req, req.files);
    }

    const feedback = await Feedback.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    await recalculateEventStats(feedback.eventId);

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: { feedback: serializeFeedback(feedback) },
      feedback: serializeFeedback(feedback),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    await deleteStoredImages(feedback.images || []);
    await Feedback.findByIdAndDelete(req.params.id);
    await recalculateEventStats(feedback.eventId);

    res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeedbackStats = async (req, res) => {
  try {
    const [
      totalFeedback,
      pendingFeedback,
      publishedFeedback,
      rejectedFeedback,
      hiddenFeedback,
      averageRatingResult,
      latestFeedback,
    ] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.countDocuments({ status: 'pending' }),
      Feedback.countDocuments({ status: 'published' }),
      Feedback.countDocuments({ status: 'rejected' }),
      Feedback.countDocuments({ status: 'hidden' }),
      Feedback.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ]),
      Feedback.find({}).sort({ createdAt: -1 }).limit(5),
    ]);

    const averageRating = Number((averageRatingResult[0]?.avg || 0).toFixed(1));
    const data = {
      totalFeedback,
      pendingFeedback,
      publishedFeedback,
      rejectedFeedback,
      hiddenFeedback,
      averageRating,
      latestFeedback: latestFeedback.map(serializeFeedback),
    };

    res.json({
      success: true,
      message: 'Feedback statistics fetched successfully',
      data,
      ...data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getAllFeedback,
  getPublicFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getFeedbackStats,
  validateFeedbackLink,
  submitFeedback,
};
