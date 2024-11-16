import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: [true, 'Payment ID is required'], // Custom error message
      unique: true, // Ensures each payment ID is unique
      trim: true, // Removes any leading or trailing whitespace
    },
    method: {
      type: String,
      required: [true, 'Payment method is required'], // Custom error message
      enum: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Cash'], // Limits allowed payment methods
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order', // References the Order model
      required: [true, 'Order ID is required'], // Custom error message
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  }
);

export const Payment = mongoose.model('Payment', paymentSchema);
