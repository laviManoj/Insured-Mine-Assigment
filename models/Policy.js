const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  policyNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  policyStartDate: {
    type: Date,
    required: true
  },
  policyEndDate: {
    type: Date,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PolicyCategory',
    required: true
  },
  carrierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PolicyCarrier',
    required: true
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  },
  collectionId: {
    type: String,
    trim: true
  },
  companyCollectionId: {
    type: String,
    trim: true
  },
  premiumAmount: {
    type: Number,
    min: 0
  },
  coverageAmount: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Cancelled', 'Pending'],
    default: 'Active'
  },
  paymentFrequency: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'],
    default: 'Monthly'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});
