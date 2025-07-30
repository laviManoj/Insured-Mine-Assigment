const mongoose = require('mongoose');

const policyCategorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  categoryCode: { type: String, unique: true, sparse: true, uppercase: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

policyCategorySchema.index({ categoryName: 1 });

module.exports = mongoose.model('PolicyCategory', policyCategorySchema);