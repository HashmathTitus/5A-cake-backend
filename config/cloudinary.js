import { v2 as cloudinary } from 'cloudinary';

export const initCloudinary = () => {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('✅ Cloudinary configured');
    return true;
  }
  console.log('⚠️ Cloudinary not configured, will use multer local storage');
  return false;
};

export default cloudinary;
