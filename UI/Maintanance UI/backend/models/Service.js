const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  estimatedCost: { type: Number, required: true },
  estimatedDuration: { type: Number, required: true }, // in minutes
  category: { type: String, enum: ['maintenance', 'repair', 'inspection', 'custom'], default: 'maintenance' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);
