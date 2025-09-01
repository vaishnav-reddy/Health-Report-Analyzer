const mongoose = require('mongoose');

const healthParameterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  normalRange: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Normal', 'High', 'Low', 'Unknown'],
    required: true
  },
  category: {
    type: String,
    required: false
  }
});

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    required: false,
    default: '' // Allow empty string for unprocessable documents
  },
  healthParameters: [healthParameterSchema],
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  isScannedDocument: {
    type: Boolean,
    default: false
  },
  requiresManualEntry: {
    type: Boolean,
    default: false
  },
  processingStatus: {
    type: String,
    enum: ['processing', 'completed', 'failed', 'manual_entry_needed', 'manual_entry_completed'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Index for faster queries
reportSchema.index({ userId: 1, createdAt: -1 });

// Virtual for parameter count
reportSchema.virtual('parameterCount').get(function() {
  return this.healthParameters.length;
});

// Virtual for abnormal parameters count
reportSchema.virtual('abnormalCount').get(function() {
  return this.healthParameters.filter(p => p.status !== 'Normal').length;
});

module.exports = mongoose.model('Report', reportSchema);
