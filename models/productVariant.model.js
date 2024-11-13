const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variantName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProductVariant', productVariantSchema); 