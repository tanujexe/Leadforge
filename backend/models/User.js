const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  picture: { type: String },
  role: { 
    type: String, 
    enum: ['Admin', 'User'], 
    default: 'User' 
  },
  isApproved: { type: Boolean, default: false },
  // Fine-grained permission toggles
  canScan: { type: Boolean, default: false },
  canEditLeads: { type: Boolean, default: false },
  canDeleteLeads: { type: Boolean, default: false },
  canExport: { type: Boolean, default: false },
  // API protections & limits
  dailyScansUsed: { type: Number, default: 0 },
  dailyScanLimit: { type: Number, default: 5 }, // Default allowed scans per day
  lastScanResetAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
