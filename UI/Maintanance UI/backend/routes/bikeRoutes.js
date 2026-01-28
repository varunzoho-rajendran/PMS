const express = require('express');
const bikeController = require('../controllers/bikeController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, bikeController.addBike);
router.get('/', authMiddleware, bikeController.getUserBikes);
router.get('/:id', authMiddleware, bikeController.getBikeById);
router.put('/:id', authMiddleware, bikeController.updateBike);
router.delete('/:id', authMiddleware, bikeController.deleteBike);

module.exports = router;
