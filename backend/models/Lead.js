const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const LeadSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  phone: { type: String, default: '' },
  website: { type: String, default: null },
  address: { type: String, default: '' },
  googleMapsUrl: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  category: { type: String, required: true },
  
  // Audits & Score (Calculated on Backend)
  websiteScore: { type: Number, default: 0 },
  websiteStatus: { 
    type: String, 
    enum: ['No Website', 'Offline', 'Responsive', 'Non Responsive', 'Slow', 'Outdated'],
    default: 'No Website'
  },
  lastAuditAt: { type: Date, default: null },
  leadScore: { type: Number, default: 0 },
  opportunityLevel: { 
    type: String, 
    enum: ['Low', 'Medium', 'High'], 
    default: 'Low' 
  },
  recommendedService: { type: String, default: '' },
  
  // Screenshot Storage Paths
  screenshotFull: { type: String, default: null },
  screenshotThumb: { type: String, default: null },
  
  // AI Insights (Generated via Groq)
  aiSummary: { type: String, default: '' },
  aiReason: { type: String, default: '' },
  callPitch: { type: String, default: '' },
  whatsappPitch: { type: String, default: '' },
  emailPitch: { type: String, default: '' },
  meetingPitch: { type: String, default: '' },
  
  // Lead Management
  status: { 
    type: String, 
    enum: ['New', 'Contacted', 'Follow Up', 'Interested', 'Closed', 'Rejected'], 
    default: 'New' 
  },
  notes: [NoteSchema],
  searchQueryId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SearchQuery' }],
  isDeleted: { type: Boolean, default: false, index: true },
  
  // CRM Tracking Fields
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  followUpDate: { type: Date, default: null },
  totalCalls: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Enforce compound/performance indexes for 500-1000+ scaling
LeadSchema.index({ searchQueryId: 1, createdAt: -1 });
LeadSchema.index({ opportunityLevel: 1, status: 1 });
LeadSchema.index({ status: 1 });
LeadSchema.index({ phone: 1 });

// Full-text index for instant server-side search querying
LeadSchema.index({ 
  businessName: 'text', 
  phone: 'text', 
  address: 'text' 
});

module.exports = mongoose.model('Lead', LeadSchema);
