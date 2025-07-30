const mongoose = require('mongoose');

const userAccountSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accountNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  accountType: {
    type: String,
    enum: ['Primary', 'Secondary', 'Joint'],
    default: 'Primary'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userAccountSchema.index({ userId: 1 });
userAccountSchema.index({ accountName: 1 });

module.exports = mongoose.model('UserAccount', userAccountSchema);