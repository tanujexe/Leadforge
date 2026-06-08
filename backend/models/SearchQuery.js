const mongoose = require('mongoose');

const SearchQuerySchema = new mongoose.Schema({
  businessType: { type: String, required: true },
  location: { type: String, required: true },
  leadCount: { type: Number, default: 0 },
  limit: { type: Number, default: 30 },
  rawDiscoveredCount: { type: Number, default: 0 },
  creditsUsed: { type: Number, default: 0 },
  durationMs: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Pending', 'Scraping', 'Auditing', 'Analyzing', 'Completed', 'Failed'], 
    default: 'Pending' 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null,
    index: true 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SearchQuery', SearchQuerySchema);
