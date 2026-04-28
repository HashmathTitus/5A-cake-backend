import Feedback from '../models/Feedback.js';
import Event from '../models/Event.js';
import { mapUploadedFiles } from '../utils/fileUtils.js';

// Get all feedback (admin)
export const getAllFeedback = async (req, res) => {
  try {
    const { eventId, rating, search = '', page = 1, limit = 10 } = req.query;

    let query = {};
    if (eventId) query.eventId = eventId;
    if (rating) query.rating = parseInt(rating);
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const feedbacks = await Feedback.find(query)
      .populate('eventId', 'name date')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(query);

    res.json({
      feedbacks,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get public feedback (filtered)
export const getPublicFeedback = async (req, res) => {
  try {
    const { eventId, page = 1, limit = 12 } = req.query;

    let query = { isPublished: true, isApproved: true };
    if (eventId) query.eventId = eventId;

    const skip = (page - 1) * limit;

    const feedbacks = await Feedback.find(query)
      .populate('eventId', 'name date')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(query);

    res.json({
      feedbacks,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single feedback
export const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id).populate('eventId');
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create feedback (public)
export const createFeedback = async (req, res) => {
  try {
    const { name, email, eventId, description, rating } = req.body;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const images = mapUploadedFiles(req, req.files);

    const feedback = await Feedback.create({
      name,
      email,
      eventId,
      description,
      rating: parseFloat(rating),
      images,
    });

    // Update event statistics
    const allFeedback = await Feedback.find({ eventId, isPublished: true, isApproved: true });
    const avgRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;

    await Event.findByIdAndUpdate(eventId, {
      feedbackCount: allFeedback.length,
      averageRating: parseFloat(avgRating.toFixed(1)),
    });

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update feedback (admin)
export const updateFeedback = async (req, res) => {
  try {
    const { name, description, rating, isApproved, isPublished } = req.body;

    const updateData = {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(rating !== undefined ? { rating: parseFloat(rating) } : {}),
      ...(isApproved !== undefined ? { isApproved: isApproved === 'true' || isApproved === true } : {}),
      ...(isPublished !== undefined ? { isPublished: isPublished === 'true' || isPublished === true } : {}),
    };

    // If new images uploaded
    if (req.files && req.files.length > 0) {
      updateData.images = mapUploadedFiles(req, req.files);
    }

    const feedback = await Feedback.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({
      message: 'Feedback updated successfully',
      feedback,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete feedback (admin)
export const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // Update event statistics
    const allFeedback = await Feedback.find({ eventId: feedback.eventId, isPublished: true });
    const avgRating = allFeedback.length > 0 ? allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length : 0;

    await Event.findByIdAndUpdate(feedback.eventId, {
      feedbackCount: allFeedback.length,
      averageRating: parseFloat(avgRating.toFixed(1)),
    });

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get feedback statistics (admin)
export const getFeedbackStats = async (req, res) => {
  try {
    const totalFeedback = await Feedback.countDocuments();
    const approvedFeedback = await Feedback.countDocuments({ isApproved: true });
    const pendingFeedback = await Feedback.countDocuments({ isApproved: false });
    const averageRating = await Feedback.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);
    const latestFeedback = await Feedback.find({})
      .populate('eventId', 'name date')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalFeedback,
      approvedFeedback,
      pendingFeedback,
      averageRating: averageRating[0]?.avg || 0,
      latestFeedback,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
};
