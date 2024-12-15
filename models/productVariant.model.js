import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
  },
  {
    timestamps: true,
  }
);

// Middleware để cập nhật totalStock của product sau khi lưu variant
productVariantSchema.post('save', async function() {
  const Product = mongoose.model('Product');
  const product = await Product.findById(this.productId);
  if (product) {
    await product.updateTotalStock();
  }
});

// Middleware để cập nhật totalStock của product sau khi xóa variant
productVariantSchema.post('remove', async function() {
  const Product = mongoose.model('Product');
  const product = await Product.findById(this.productId);
  if (product) {
    await product.updateTotalStock();
  }
});

export const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);
