import { v2 as cloudinary } from 'cloudinary';

let initialized = false;

export const initCloudinary = () => {
  if (initialized) {
    return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  }

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('✅ Cloudinary configured');
    initialized = true;
    return true;
  }

  console.log('⚠️ Cloudinary not configured, using local storage fallback');
  initialized = true;
  return false;
};

export default cloudinary;
