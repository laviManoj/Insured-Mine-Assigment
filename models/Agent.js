const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  agentName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  agentId: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  department: {
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

agentSchema.index({ agentName: 1 });

module.exports = mongoose.model('Agent', agentSchema);