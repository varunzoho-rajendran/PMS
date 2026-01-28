# Backend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Create `.env` file from `.env.example`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/two-wheeler-maintenance
JWT_SECRET=your_very_secure_secret_key_12345
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### 3. Start MongoDB
Make sure MongoDB is running on your machine or use MongoDB Atlas.

For local MongoDB:
```bash
mongod
```

### 4. Run the Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

Server will run on `http://localhost:5000`

## API Testing

### Test Health Check
```bash
curl http://localhost:5000/api/health
```

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "password123",
    "address": "123 Main St",
    "city": "New York"
  }'
```

### Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## Database Schema

### Collections
- users
- bikes
- services
- bookings
- maintenances

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Verify network connectivity

### Port Already in Use
Change PORT in .env or kill the process using the port:
```bash
# On Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### JWT Issues
- Ensure JWT_SECRET is set
- Check token in Authorization header format: `Bearer <token>`

## File Structure Details

### controllers/
Contains business logic for each entity (auth, bikes, bookings, services, maintenance, admin)

### models/
Mongoose schemas for MongoDB collections

### routes/
Express routes with proper middleware and validation

### middleware/
Authentication and authorization checks

### server.js
Main Express application file with database connection
