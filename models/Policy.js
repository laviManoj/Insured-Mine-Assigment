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

policySchema.index({ policyNumber: 1 });
policySchema.index({ userId: 1 });
policySchema.index({ categoryId: 1 });
policySchema.index({ carrierId: 1 });
policySchema.index({ policyStartDate: 1, policyEndDate: 1 });
policySchema.index({ status: 1 });

// Virtual for policy duration
policySchema.virtual('policyDuration').get(function() {
  return Math.ceil((this.policyEndDate - this.policyStartDate) / (1000 * 60 * 60 * 24));
});

// Check if policy is currently active
policySchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.status === 'Active' && 
         this.policyStartDate <= now && 
         this.policyEndDate >= now;
});

module.exports = mongoose.model('Policy', policySchema);