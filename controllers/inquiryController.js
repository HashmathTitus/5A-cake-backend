import Inquiry from '../models/Inquiry.js';
import { mapUploadedFiles, mapImageUrls, normalizeStoredImage } from '../utils/fileUtils.js';
import fs from 'fs/promises';
import path from 'path';

const serializeInquiry = (inquiry) => {
  if (!inquiry) {
    return null;
  }

  const plain = inquiry.toObject ? inquiry.toObject() : inquiry;

  return {
    ...plain,
    referenceImages: mapImageUrls(plain.referenceImages || []),
  };
};

const deleteStoredImages = async (images = []) => {
  const normalizedImages = images.map(normalizeStoredImage).filter(Boolean);
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

export const createInquiry = async (req, res) => {
  try {
    if (req.files && req.files.length > 3) {
      return res.status(400).json({ success: false, message: 'Maximum 3 reference images are allowed' });
    }

    const inquiry = await Inquiry.create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      eventType: req.body.eventType,
      eventDate: req.body.eventDate,
      location: req.body.location,
      guestCount: req.body.guestCount,
      message: req.body.message,
      budgetRange: req.body.budgetRange,
      preferredContactMethod: req.body.preferredContactMethod,
      referenceImages: mapUploadedFiles(req, req.files),
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully',
      data: { inquiry: serializeInquiry(inquiry) },
      inquiry: serializeInquiry(inquiry),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllInquiries = async (req, res) => {
  try {
    const { status, search = '', page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { eventType: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const inquiries = await Inquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    const total = await Inquiry.countDocuments(query);

    res.json({
      success: true,
      message: 'Inquiries fetched successfully',
      data: {
        inquiries: inquiries.map(serializeInquiry),
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
      },
      inquiries: inquiries.map(serializeInquiry),
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    res.json({
      success: true,
      message: 'Inquiry status updated successfully',
      data: { inquiry: serializeInquiry(inquiry) },
      inquiry: serializeInquiry(inquiry),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    await deleteStoredImages(inquiry.referenceImages || []);
    await Inquiry.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInquiryStats = async (req, res) => {
  try {
    const [totalInquiries, newInquiries, contactedInquiries, confirmedInquiries, completedInquiries] = await Promise.all([
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: 'new' }),
      Inquiry.countDocuments({ status: 'contacted' }),
      Inquiry.countDocuments({ status: 'confirmed' }),
      Inquiry.countDocuments({ status: 'completed' }),
    ]);

    const recentInquiries = await Inquiry.find({}).sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      message: 'Inquiry statistics fetched successfully',
      data: {
        totalInquiries,
        newInquiries,
        contactedInquiries,
        confirmedInquiries,
        completedInquiries,
        recentInquiries: recentInquiries.map(serializeInquiry),
      },
      totalInquiries,
      newInquiries,
      contactedInquiries,
      confirmedInquiries,
      completedInquiries,
      recentInquiries: recentInquiries.map(serializeInquiry),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  createInquiry,
  getAllInquiries,
  updateInquiryStatus,
  deleteInquiry,
  getInquiryStats,
};