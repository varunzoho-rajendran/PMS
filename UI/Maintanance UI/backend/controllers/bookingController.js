const Booking = require('../models/Booking');
const Service = require('../models/Service');

const createBooking = async (req, res) => {
  try {
    const { bikeId, serviceIds, bookingDate, notes } = req.body;
    
    const services = await Service.find({ _id: { $in: serviceIds } });
    const totalCost = services.reduce((sum, service) => sum + service.estimatedCost, 0);
    const maxDuration = Math.max(...services.map(s => s.estimatedDuration));
    const estimatedCompletionDate = new Date(bookingDate);
    estimatedCompletionDate.setMinutes(estimatedCompletionDate.getMinutes() + maxDuration);

    const booking = new Booking({
      userId: req.userId,
      bikeId,
      serviceIds,
      bookingDate,
      estimatedCompletionDate,
      totalCost,
      notes,
      status: 'pending'
    });

    await booking.save();
    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create booking', error: error.message });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.userId })
      .populate('bikeId')
      .populate('serviceIds')
      .populate('mechanic', 'name email phone');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('bikeId')
      .populate('serviceIds')
      .populate('mechanic', 'name email phone');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch booking', error: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status, mechanic, actualCompletionDate } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, mechanic, actualCompletionDate, updatedAt: Date.now() },
      { new: true }
    ).populate('serviceIds');
    res.json({ message: 'Booking updated successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update booking', error: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email phone')
      .populate('bikeId')
      .populate('serviceIds')
      .populate('mechanic', 'name email phone');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
};

module.exports = { createBooking, getUserBookings, getBookingById, updateBookingStatus, getAllBookings };
