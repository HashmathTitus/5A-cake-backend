import Event from '../models/Event.js';
import Feedback from '../models/Feedback.js';
import { mapUploadedFiles } from '../utils/fileUtils.js';

// Get all events (public)
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({}).sort({ date: -1, createdAt: -1 });
    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single event
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create event (admin only)
export const createEvent = async (req, res) => {
  try {
    const { name, description, date, location } = req.body;
    const images = mapUploadedFiles(req, req.files);

    const event = await Event.create({
      name,
      description,
      date,
      location,
      images,
    });

    res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update event (admin only)
export const updateEvent = async (req, res) => {
  try {
    const { name, description, date, location, status } = req.body;

    const updateData = {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(date !== undefined ? { date } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(status !== undefined ? { status } : {}),
    };

    // If new images uploaded, update them
    if (req.files && req.files.length > 0) {
      updateData.images = mapUploadedFiles(req, req.files);
    }

    const event = await Event.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete event (admin only)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Delete all feedbacks for this event
    await Feedback.deleteMany({ eventId: req.params.id });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get event statistics (admin only)
export const getEventStats = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const upcomingEvents = await Event.countDocuments({ status: 'upcoming' });
    const completedEvents = await Event.countDocuments({ status: 'completed' });
    const ongoingEvents = await Event.countDocuments({ status: 'ongoing' });

    res.json({
      totalEvents,
      upcomingEvents,
      ongoingEvents,
      completedEvents,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats,
};
