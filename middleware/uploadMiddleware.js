import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary, { initCloudinary } from '../config/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const maxFileSize = 5 * 1024 * 1024; // 5MB

initCloudinary();

const createSafeFilename = (file) => {
  const parsedName = path.basename(file.originalname, path.extname(file.originalname))
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'upload';
  const extension = path.extname(file.originalname).toLowerCase();
  return `${parsedName}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
};

const buildStorage = () => {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    return new CloudinaryStorage({
      cloudinary,
      params: {
        folder: '5a-events',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      },
    });
  }

  const uploadDir = path.resolve(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, createSafeFilename(file)),
  });
};

const upload = multer({
  storage: buildStorage(),
  limits: { fileSize: maxFileSize },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      return cb(new Error('Only JPG, PNG and WEBP images are allowed'));
    }

    if (file.size && file.size > maxFileSize) {
      return cb(new Error('Image size must be less than 5MB'));
    }

    return cb(null, true);
  },
});

export default upload;
