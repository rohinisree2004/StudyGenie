import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

// Configure Cloudinary with environment credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'rw6c6v28',
  api_key: process.env.CLOUDINARY_API_KEY || '444315819867291',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'EXhhjb_3MzuxdJ9wfHZicAGPWnw',
  secure: true,
});

/**
 * Upload an image or file buffer / path to Cloudinary
 * @param {string} filePath - Absolute path to temporary uploaded file
 * @param {object} options - Cloudinary upload options (folder, resource_type, etc.)
 */
export const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      ...options,
    });
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('Cloudinary Upload Error:', error.message);
    throw error;
  }
};

/**
 * Delete an asset from Cloudinary by public ID
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error('Cloudinary Deletion Error:', error.message);
    return null;
  }
};

export default cloudinary;
