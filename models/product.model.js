import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    material: {
      type: String,
      trim: true,
    },
    totalStock: {
      type: Number,
      default: 0,
      min: 0
    },
    image: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
  }
);

// Middleware để tự động cập nhật totalStock
productSchema.methods.updateTotalStock = async function() {
  const ProductVariant = mongoose.model('ProductVariant');
  const variants = await ProductVariant.find({ productId: this._id });
  this.totalStock = variants.reduce((sum, variant) => sum + variant.quantity, 0);
  await this.save();
};

export const Product = mongoose.model('Product', productSchema);
