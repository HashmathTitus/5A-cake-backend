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

const InquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: [40, 'Phone number cannot exceed 40 characters'],
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      trim: true,
      maxlength: [120, 'Event type cannot exceed 120 characters'],
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    guestCount: {
      type: String,
      default: '',
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Inquiry message is required'],
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    budgetRange: {
      type: String,
      default: '',
      trim: true,
      maxlength: [120, 'Budget range cannot exceed 120 characters'],
    },
    preferredContactMethod: {
      type: String,
      enum: ['whatsapp', 'phone', 'email'],
      default: 'whatsapp',
    },
    referenceImages: [imageSchema],
    status: {
      type: String,
      enum: ['new', 'contacted', 'confirmed', 'completed', 'cancelled'],
      default: 'new',
      index: true,
    },
  },
  { timestamps: true }
);

InquirySchema.index({ status: 1, createdAt: -1 });

const Inquiry = mongoose.model('Inquiry', InquirySchema);

export default Inquiry;