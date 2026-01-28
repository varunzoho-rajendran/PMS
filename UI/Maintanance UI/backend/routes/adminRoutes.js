const express = require('express');
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authMiddleware, adminMiddleware, adminController.getDashboardStats);
router.get('/users', authMiddleware, adminMiddleware, adminController.getAllUsers);
router.put('/users/:id/role', authMiddleware, adminMiddleware, adminController.updateUserRole);
router.put('/users/:id/deactivate', authMiddleware, adminMiddleware, adminController.deactivateUser);
router.get('/reports/revenue', authMiddleware, adminMiddleware, adminController.getRevenueReport);

module.exports = router;
