const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', require('../middleware/auth').authMiddleware, authController.getProfile);
router.put('/profile', require('../middleware/auth').authMiddleware, authController.updateProfile);

module.exports = router;
