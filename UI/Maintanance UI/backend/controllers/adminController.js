const User = require('../models/User');
const Booking = require('../models/Booking');
const Bike = require('../models/Bike');
const Maintenance = require('../models/Maintenance');

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalBookings = await Booking.countDocuments();
    const totalBikes = await Bike.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const totalMaintenance = await Maintenance.countDocuments();

    const revenueData = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalCost' } } }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    res.json({
      totalUsers,
      totalBookings,
      totalBikes,
      completedBookings,
      pendingBookings,
      totalMaintenance,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, updatedAt: Date.now() },
      { new: true }
    ).select('-password');
    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    ).select('-password');
    res.json({ message: 'User deactivated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to deactivate user', error: error.message });
  }
};

const getRevenueReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const revenueByService = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: '$serviceIds' },
      {
        $group: {
          _id: '$serviceIds',
          count: { $sum: 1 },
          totalCost: { $sum: '$totalCost' }
        }
      },
      { $sort: { totalCost: -1 } }
    ]);

    res.json(revenueByService);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch revenue report', error: error.message });
  }
};

module.exports = { getDashboardStats, getAllUsers, updateUserRole, deactivateUser, getRevenueReport };
