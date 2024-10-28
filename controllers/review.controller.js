const Review = require('../models/review.model');
const Product = require('../models/product.model');
const { uploadImage } = require('../utils/cloudinary');

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    
    // Check if user has purchased the product
    const hasPurchased = await Order.exists({
      user: req.user._id,
      'items.product': productId,
      orderStatus: 'delivered'
    });

    if (!hasPurchased) {
      return res.status(403).json({ 
        message: 'You can only review products you have purchased' 
      });
    }

    let images = [];
    if (req.files) {
      for (const file of req.files) {
        const result = await uploadImage(file);
        images.push(result);
      }
    }

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      rating,
      comment,
      images
    });

    // Update product average rating
    const reviews = await Review.find({ product: productId });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      averageRating: avgRating
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId })
      .populate('user', 'username');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
