const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  leadId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lead', 
    required: true, 
    index: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  actionType: { 
    type: String, 
    enum: ['Create', 'StatusChange', 'AddNote', 'Audited', 'AIRegenerated', 'CallLog', 'Assign', 'Restore', 'Purge'], 
    required: true 
  },
  details: { 
    type: String, 
    default: '' 
  },
  // Specific to call logs
  callOutcome: { 
    type: String, 
    default: null 
  },
  followUpDate: { 
    type: Date, 
    default: null 
  },
  timestamp: { 
    type: Date, 
    default: Date.now, 
    required: true 
  },
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
}, {
  timestamps: false // We use our own timestamp field for absolute speed and index optimization
});

// Compound index for fast timeline lookups
ActivityLogSchema.index({ leadId: 1, timestamp: -1 });
ActivityLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
