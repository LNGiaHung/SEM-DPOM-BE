import mongoose from 'mongoose';

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'], // Custom error message
      trim: true, // Removes whitespace from both ends of the string
      unique: true, // Ensures category names are unique
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  }
);

export const Category = mongoose.model('Category', categorySchema);
