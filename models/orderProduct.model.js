import mongoose from 'mongoose';

const orderProductSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order', // References the Order model
      required: [true, 'Order ID is required'], // Custom error message
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product', // References the Product model
      required: [true, 'Product ID is required'], // Custom error message
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'], // Custom error message
      min: [1, 'Quantity cannot be less than 1'], // Validation for non-negative and minimum 1 quantity
    },
    price: {
      type: Number,
      required: [true, 'Price is required'], // Custom error message
      min: [0, 'Price cannot be negative'], // Ensures non-negative price
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

export const OrderProduct = mongoose.model('OrderProduct', orderProductSchema);
