import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const EventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      minlength: [3, 'Event name must be at least 3 characters'],
      maxlength: [100, 'Event name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    location: {
      type: String,
      trim: true,
      required: [true, 'Location is required'],
    },
    category: {
      type: String,
      trim: true,
      default: 'General Event',
    },
    coverImage: imageSchema,
    images: [
      imageSchema,
    ],
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed'],
      default: 'upcoming',
    },
    visibility: {
      type: String,
      enum: ['draft', 'published', 'completed', 'hidden'],
      default: 'published',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    feedbackCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', EventSchema);
export default Event;
