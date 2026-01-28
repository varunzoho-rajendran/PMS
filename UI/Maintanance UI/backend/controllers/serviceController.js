const Service = require('../models/Service');

const createService = async (req, res) => {
  try {
    const { name, description, estimatedCost, estimatedDuration, category } = req.body;
    
    const service = new Service({ name, description, estimatedCost, estimatedDuration, category });
    await service.save();
    res.status(201).json({ message: 'Service created successfully', service });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create service', error: error.message });
  }
};

const getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch services', error: error.message });
  }
};

const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch service', error: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    const { name, description, estimatedCost, estimatedDuration, category, isActive } = req.body;
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { name, description, estimatedCost, estimatedDuration, category, isActive, updatedAt: Date.now() },
      { new: true }
    );
    res.json({ message: 'Service updated successfully', service });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update service', error: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete service', error: error.message });
  }
};

module.exports = { createService, getAllServices, getServiceById, updateService, deleteService };
