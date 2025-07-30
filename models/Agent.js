const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  agentName: { type: String, required: true, trim: true },
  agentId: { type: String, unique: true, sparse: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  department: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports =  mongoose.model('Agent', agentSchema);