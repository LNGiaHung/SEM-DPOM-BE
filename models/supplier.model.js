const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Supplier', supplierSchema); 