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

const FeedbackSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    customerEmail: {
      type: String,
      default: '',
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
    },
    customerPhone: {
      type: String,
      default: '',
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Feedback message is required'],
      minlength: [10, 'Description must be at least 10 characters'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    status: {
      type: String,
      enum: ['pending', 'published', 'rejected', 'hidden'],
      default: 'pending',
      index: true,
    },
    token: {
      type: String,
      default: '',
      index: true,
    },
    tokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedbackToken',
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    images: [
      imageSchema,
    ],
  },
  { timestamps: true }
);

// Populate event on find
FeedbackSchema.pre(/^find/, function (next) {
  if (this.options._recursed) {
    return next();
  }
  this.populate({
    path: 'eventId',
    select: 'name date location category coverImage visibility featured',
  });
  next();
});

FeedbackSchema.index({ eventId: 1, status: 1, createdAt: -1 });

const Feedback = mongoose.model('Feedback', FeedbackSchema);
export default Feedback;
