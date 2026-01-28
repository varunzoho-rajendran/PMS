const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  registrationNumber: { type: String, required: true, unique: true },
  manufacturer: String,
  model: String,
  year: Number,
  engineNumber: String,
  chassisNumber: String,
  fuelType: { type: String, enum: ['petrol', 'diesel', 'electric'], default: 'petrol' },
  lastServiceDate: Date,
  nextServiceDate: Date,
  mileage: { type: Number, default: 0 },
  color: String,
  status: { type: String, enum: ['active', 'inactive', 'under_maintenance'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bike', bikeSchema);
