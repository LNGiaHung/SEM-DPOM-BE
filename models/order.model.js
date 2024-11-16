import mongoose from 'mongoose';

const orderSchema = mongoose.Schema(
  {
    total: {
      type: Number,
      required: [true, 'Total amount is required'], // Custom error message
      min: [0, 'Total amount cannot be negative'], // Ensures non-negative total
    },
    orderDate: {
      type: Date,
      default: Date.now, // Defaults to the current date and time
    },
    finalDate: {
      type: Date, // Corrected the typo from `finalData` to `finalDate`
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // References the User model
      required: [true, 'User ID is required'], // Custom error message
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);



export const Order = mongoose.model('Order', orderSchema);
