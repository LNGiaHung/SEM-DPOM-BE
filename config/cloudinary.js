import cloudinary from 'cloudinary';
import { ENV_VARS } from './envVars.js';

// Configure cloudinary
cloudinary.v2.config({
    cloud_name: ENV_VARS.CLOUDINARY_CLOUD_NAME,
    api_key: ENV_VARS.CLOUDINARY_API_KEY,
    api_secret: ENV_VARS.CLOUDINARY_API_SECRET
});

// Helper function to validate Cloudinary connection
export const validateCloudinaryConnection = async () => {
    try {
        const result = await cloudinary.v2.api.ping();
        console.log('Cloudinary connection successful:', result);
        return true;
    } catch (error) {
        console.error('Cloudinary connection error:', error);
        return false;
    }
};

export default cloudinary;
