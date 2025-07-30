const mongoose = require('mongoose');

const policyCarrierSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  companyCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

policyCarrierSchema.index({ companyName: 1 });

module.exports = mongoose.model('PolicyCarrier', policyCarrierSchema);