import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check if Cloudinary is configured
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME ? true : false;

let upload;

if (useCloudinary) {
  // Cloudinary configuration
  import('multer-storage-cloudinary').then(({ CloudinaryStorage }) => {
    import('cloudinary').then(({ v2: cloudinary }) => {
      const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
          folder: '5a-feedback',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        },
      });

      upload = multer({
        storage,
        fileFilter: (req, file, cb) => {
          const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error('Invalid file type. Only images allowed.'));
          }
        },
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      });
    });
  });
} else {
  // Local multer storage
  const uploadDir = 'uploads';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const createSafeFilename = (file) => {
    const parsedName = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'upload';
    const extension = path.extname(file.originalname).toLowerCase();
    return `${parsedName}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
  };

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, createSafeFilename(file));
    },
  });

  upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      if (allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only images allowed.'));
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  });
}

export default upload;
