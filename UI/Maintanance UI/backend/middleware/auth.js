const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const mechanicMiddleware = (req, res, next) => {
  if (req.userRole !== 'mechanic' && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Mechanic access required' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware, mechanicMiddleware };
