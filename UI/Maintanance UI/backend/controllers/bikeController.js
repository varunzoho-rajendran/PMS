const Bike = require('../models/Bike');

const addBike = async (req, res) => {
  try {
    const { registrationNumber, manufacturer, model, year, engineNumber, chassisNumber, fuelType, color } = req.body;
    
    const existingBike = await Bike.findOne({ registrationNumber });
    if (existingBike) {
      return res.status(400).json({ message: 'Bike already registered' });
    }

    const bike = new Bike({
      userId: req.userId,
      registrationNumber,
      manufacturer,
      model,
      year,
      engineNumber,
      chassisNumber,
      fuelType,
      color
    });
    
    await bike.save();
    res.status(201).json({ message: 'Bike added successfully', bike });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add bike', error: error.message });
  }
};

const getUserBikes = async (req, res) => {
  try {
    const bikes = await Bike.find({ userId: req.userId });
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bikes', error: error.message });
  }
};

const getBikeById = async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) return res.status(404).json({ message: 'Bike not found' });
    res.json(bike);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bike', error: error.message });
  }
};

const updateBike = async (req, res) => {
  try {
    const { mileage, lastServiceDate, nextServiceDate, status } = req.body;
    const bike = await Bike.findByIdAndUpdate(
      req.params.id,
      { mileage, lastServiceDate, nextServiceDate, status, updatedAt: Date.now() },
      { new: true }
    );
    res.json({ message: 'Bike updated successfully', bike });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update bike', error: error.message });
  }
};

const deleteBike = async (req, res) => {
  try {
    await Bike.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bike deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete bike', error: error.message });
  }
};

module.exports = { addBike, getUserBikes, getBikeById, updateBike, deleteBike };
