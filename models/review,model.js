import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    images: [
      {
        url: String,
        public_id: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent multiple reviews from the same user for the same product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);
