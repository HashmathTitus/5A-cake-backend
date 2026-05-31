import Event from '../models/Event.js';
import Feedback from '../models/Feedback.js';
import FeedbackToken from '../models/FeedbackToken.js';
import { mapUploadedFiles, mapImageUrls, normalizeStoredImage } from '../utils/fileUtils.js';
import { recalculateEventStats } from '../services/eventStatsService.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const serializeEvent = (event) => {
  if (!event) {
    return null;
  }

  const plain = event.toObject ? event.toObject() : event;

  return {
    ...plain,
    images: mapImageUrls(plain.images || []),
  };
};

const buildCoverImage = (images = [], explicitCoverImage = null) => {
  if (explicitCoverImage) {
    return explicitCoverImage;
  }

  return images[0] || null;
};

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
    await Promise.all(
      cloudinaryPublicIds.map((publicId) => cloudinary.uploader.destroy(publicId, { invalidate: true }))
    );
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

// Get all events (public gallery)
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({ visibility: { $nin: ['draft', 'hidden'] } }).sort({ featured: -1, date: -1, createdAt: -1 });
    res.json({
      success: true,
      message: 'Public events fetched successfully',
      data: { events: events.map(serializeEvent) },
      events: events.map(serializeEvent),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminEvents = async (req, res) => {
  try {
    const events = await Event.find({}).sort({ featured: -1, createdAt: -1, date: -1 });
    res.json({
      success: true,
      message: 'Events fetched successfully',
      data: { events: events.map(serializeEvent) },
      events: events.map(serializeEvent),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single event
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({
      success: true,
      data: { event: serializeEvent(event) },
      event: serializeEvent(event),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create event (admin only)
export const createEvent = async (req, res) => {
  try {
    const { name, description, date, location, category, visibility, featured } = req.body;
    if (req.files && req.files.length > 5) {
      return res.status(400).json({ success: false, message: 'Maximum 5 images are allowed for events' });
    }

    const images = mapUploadedFiles(req, req.files);
    const coverImage = buildCoverImage(images, req.body.coverImage ? { url: req.body.coverImage, publicId: null } : null);

    const event = await Event.create({
      name,
      description,
      date,
      location,
      status: req.body.status,
      category,
      visibility,
      featured: featured === 'true' || featured === true,
      coverImage,
      images,
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event: serializeEvent(event) },
      event: serializeEvent(event),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update event (admin only)
export const updateEvent = async (req, res) => {
  try {
    const { name, description, date, location, status, category, visibility, featured } = req.body;
    const existingEvent = await Event.findById(req.params.id);

    if (!existingEvent) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const updateData = {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(date !== undefined ? { date } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(visibility !== undefined ? { visibility } : {}),
      ...(featured !== undefined ? { featured: featured === 'true' || featured === true } : {}),
    };

    // If new images uploaded, update them
    if (req.files && req.files.length > 0) {
      if (req.files.length > 5) {
        return res.status(400).json({ success: false, message: 'Maximum 5 images are allowed for events' });
      }

      await deleteStoredImages(existingEvent.images || []);
      updateData.images = mapUploadedFiles(req, req.files);
      updateData.coverImage = buildCoverImage(updateData.images, existingEvent.coverImage || null);
    }

    if (req.body.coverImage) {
      updateData.coverImage = { url: req.body.coverImage, publicId: null };
    }

    const event = await Event.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { event: serializeEvent(event) },
      event: serializeEvent(event),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete event (admin only)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const relatedFeedback = await Feedback.find({ eventId: req.params.id });
    await Promise.all(relatedFeedback.map((feedback) => deleteStoredImages(feedback.images || [])));
    await Feedback.deleteMany({ eventId: req.params.id });
    await deleteStoredImages(event.images || []);

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get event statistics (admin only)
export const getEventStats = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const draftEvents = await Event.countDocuments({ visibility: 'draft' });
    const publishedEvents = await Event.countDocuments({ visibility: 'published' });
    const upcomingEvents = await Event.countDocuments({ status: 'upcoming' });
    const completedEvents = await Event.countDocuments({ status: 'completed' });
    const ongoingEvents = await Event.countDocuments({ status: 'ongoing' });
    const hiddenEvents = await Event.countDocuments({ visibility: 'hidden' });

    res.json({
      success: true,
      message: 'Event statistics fetched successfully',
      data: {
        totalEvents,
        draftEvents,
        publishedEvents,
        upcomingEvents,
        ongoingEvents,
        completedEvents,
        hiddenEvents,
      },
      totalEvents,
      draftEvents,
      publishedEvents,
      upcomingEvents,
      ongoingEvents,
      completedEvents,
      hiddenEvents,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateFeedbackLink = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status !== 'completed' && event.visibility !== 'completed') {
      return res.status(400).json({ success: false, message: 'Feedback links can only be generated for completed events' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const feedbackToken = await FeedbackToken.create({
      eventId: event._id,
      token,
      expiresAt,
      createdBy: req.admin?.id || null,
    });

    const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const feedbackLink = `${baseUrl}/feedback/${event._id.toString()}/${token}`;

    res.status(201).json({
      success: true,
      message: 'Feedback link generated successfully',
      data: {
        token: feedbackToken,
        feedbackLink,
      },
      token: feedbackToken,
      feedbackLink,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getAllEvents,
  getAdminEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats,
  generateFeedbackLink,
};
