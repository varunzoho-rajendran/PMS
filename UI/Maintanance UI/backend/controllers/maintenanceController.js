const Maintenance = require('../models/Maintenance');

const createMaintenance = async (req, res) => {
  try {
    const { bikeId, bookingId, serviceType, description, partsUsed, mileage, cost, mechanic, nextMaintenanceSchedule, notes } = req.body;
    
    const maintenance = new Maintenance({
      bikeId,
      bookingId,
      serviceType,
      description,
      partsUsed,
      mileage,
      cost,
      mechanic,
      nextMaintenanceSchedule,
      notes
    });

    await maintenance.save();
    res.status(201).json({ message: 'Maintenance record created successfully', maintenance });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create maintenance record', error: error.message });
  }
};

const getBikeMaintenanceHistory = async (req, res) => {
  try {
    const { bikeId } = req.params;
    const history = await Maintenance.find({ bikeId })
      .populate('mechanic', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch maintenance history', error: error.message });
  }
};

const getMaintenanceById = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate('mechanic', 'name email phone')
      .populate('bikeId');
    if (!maintenance) return res.status(404).json({ message: 'Maintenance record not found' });
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch maintenance record', error: error.message });
  }
};

const updateMaintenance = async (req, res) => {
  try {
    const { status, description, partsUsed, cost, nextMaintenanceSchedule, notes } = req.body;
    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { status, description, partsUsed, cost, nextMaintenanceSchedule, notes, updatedAt: Date.now() },
      { new: true }
    );
    res.json({ message: 'Maintenance record updated successfully', maintenance });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update maintenance record', error: error.message });
  }
};

const getAllMaintenanceRecords = async (req, res) => {
  try {
    const records = await Maintenance.find()
      .populate('bikeId', 'registrationNumber manufacturer model')
      .populate('mechanic', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch maintenance records', error: error.message });
  }
};

module.exports = { createMaintenance, getBikeMaintenanceHistory, getMaintenanceById, updateMaintenance, getAllMaintenanceRecords };
