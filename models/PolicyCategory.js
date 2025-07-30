const mongoose = require('mongoose');

const policyCategorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  categoryCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

policyCategorySchema.index({ categoryName: 1 });

module.exports = mongoose.model('PolicyCategory', policyCategorySchema);