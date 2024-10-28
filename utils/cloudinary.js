const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.uploadImage = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'ecommerce'
    });
    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    throw new Error('Error uploading image');
  }
};

exports.deleteImage = async (public_id) => {
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    throw new Error('Error deleting image');
  }
};
