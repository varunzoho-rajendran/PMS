const express = require('express');
const maintenanceController = require('../controllers/maintenanceController');
const { authMiddleware, mechanicMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, mechanicMiddleware, maintenanceController.createMaintenance);
router.get('/history/:bikeId', maintenanceController.getBikeMaintenanceHistory);
router.get('/:id', maintenanceController.getMaintenanceById);
router.put('/:id', authMiddleware, mechanicMiddleware, maintenanceController.updateMaintenance);
router.get('/admin/all', authMiddleware, mechanicMiddleware, maintenanceController.getAllMaintenanceRecords);

module.exports = router;
