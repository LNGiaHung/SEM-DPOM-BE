import mongoose from 'mongoose';

const cartSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product', // Reference to the Product model
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1, // Default quantity is 1
          min: [1, 'Quantity cannot be less than 1'], // Non-negative validation
        },
      },
    ],
    totalPrice: {
      type: Number,
      default: 0, // Optional field for total price
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);



export const Cart = mongoose.model('Cart', cartSchema);
