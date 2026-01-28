# API Reference Guide

## Base URL
```
http://localhost:5000/api
```

All requests must include the Authorization header for protected routes:
```
Authorization: Bearer <token>
```

## Authentication Endpoints

### Register User
**POST** `/auth/register`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "address": "123 Main Street",
  "city": "New York"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Login
**POST** `/auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Get Profile
**GET** `/auth/profile` (Protected)

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "address": "123 Main Street",
  "city": "New York",
  "role": "user",
  "isActive": true,
  "createdAt": "2023-01-15T10:30:00Z",
  "updatedAt": "2023-01-15T10:30:00Z"
}
```

### Update Profile
**PUT** `/auth/profile` (Protected)

**Request:**
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "address": "456 Oak Avenue",
  "city": "Boston"
}
```

## Bike Endpoints

### Add Bike
**POST** `/bikes` (Protected)

**Request:**
```json
{
  "registrationNumber": "DL01AB1234",
  "manufacturer": "Honda",
  "model": "CB500F",
  "year": 2023,
  "engineNumber": "ENG123456",
  "chassisNumber": "CHS123456",
  "fuelType": "petrol",
  "color": "Black"
}
```

**Response:**
```json
{
  "message": "Bike added successfully",
  "bike": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "registrationNumber": "DL01AB1234",
    "manufacturer": "Honda",
    "model": "CB500F",
    "year": 2023,
    "status": "active",
    "mileage": 0,
    "createdAt": "2023-01-15T10:30:00Z"
  }
}
```

### Get User's Bikes
**GET** `/bikes` (Protected)

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "registrationNumber": "DL01AB1234",
    "manufacturer": "Honda",
    "model": "CB500F",
    "status": "active",
    "mileage": 5000
  }
]
```

### Get Bike Details
**GET** `/bikes/:id` (Protected)

### Update Bike
**PUT** `/bikes/:id` (Protected)

**Request:**
```json
{
  "mileage": 5000,
  "status": "active"
}
```

### Delete Bike
**DELETE** `/bikes/:id` (Protected)

## Service Endpoints

### Get All Services
**GET** `/services`

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439020",
    "name": "Basic Maintenance",
    "description": "Oil change, filter replacement",
    "estimatedCost": 500,
    "estimatedDuration": 30,
    "category": "maintenance",
    "isActive": true
  }
]
```

### Create Service (Admin Only)
**POST** `/services` (Protected, Admin)

**Request:**
```json
{
  "name": "Engine Overhaul",
  "description": "Complete engine inspection and service",
  "estimatedCost": 5000,
  "estimatedDuration": 480,
  "category": "repair"
}
```

### Update Service (Admin Only)
**PUT** `/services/:id` (Protected, Admin)

### Delete Service (Admin Only)
**DELETE** `/services/:id` (Protected, Admin)

## Booking Endpoints

### Create Booking
**POST** `/bookings` (Protected)

**Request:**
```json
{
  "bikeId": "507f1f77bcf86cd799439012",
  "serviceIds": ["507f1f77bcf86cd799439020", "507f1f77bcf86cd799439021"],
  "bookingDate": "2023-02-15T10:00:00Z",
  "notes": "Bike making unusual noise"
}
```

**Response:**
```json
{
  "message": "Booking created successfully",
  "booking": {
    "_id": "507f1f77bcf86cd799439030",
    "userId": "507f1f77bcf86cd799439011",
    "bikeId": "507f1f77bcf86cd799439012",
    "serviceIds": ["507f1f77bcf86cd799439020"],
    "bookingDate": "2023-02-15T10:00:00Z",
    "status": "pending",
    "totalCost": 500,
    "createdAt": "2023-01-15T10:30:00Z"
  }
}
```

### Get User's Bookings
**GET** `/bookings/user/my-bookings` (Protected)

### Get Booking Details
**GET** `/bookings/:id` (Protected)

### Update Booking Status (Admin Only)
**PUT** `/bookings/:id` (Protected, Admin)

**Request:**
```json
{
  "status": "confirmed",
  "mechanic": "507f1f77bcf86cd799439015"
}
```

**Status Options:** pending, confirmed, in_progress, completed, cancelled

### Get All Bookings (Admin Only)
**GET** `/bookings/admin/all` (Protected, Admin)

## Maintenance Endpoints

### Create Maintenance Record (Mechanic/Admin Only)
**POST** `/maintenance` (Protected, Mechanic/Admin)

**Request:**
```json
{
  "bikeId": "507f1f77bcf86cd799439012",
  "bookingId": "507f1f77bcf86cd799439030",
  "serviceType": "Oil Change",
  "description": "Changed engine oil and filter",
  "partsUsed": "Mobil 10W-30 Oil, OEM Filter",
  "mileage": 5100,
  "cost": 500,
  "mechanic": "507f1f77bcf86cd799439015",
  "nextMaintenanceSchedule": "2023-04-15T00:00:00Z",
  "notes": "Bike is running smoothly"
}
```

### Get Maintenance History
**GET** `/maintenance/history/:bikeId`

### Get Maintenance Details
**GET** `/maintenance/:id`

### Update Maintenance Record (Mechanic/Admin Only)
**PUT** `/maintenance/:id` (Protected, Mechanic/Admin)

### Get All Maintenance Records (Mechanic/Admin Only)
**GET** `/maintenance/admin/all` (Protected, Mechanic/Admin)

## Admin Endpoints

### Get Dashboard Statistics (Admin Only)
**GET** `/admin/stats` (Protected, Admin)

**Response:**
```json
{
  "totalUsers": 45,
  "totalBookings": 120,
  "totalBikes": 85,
  "completedBookings": 110,
  "pendingBookings": 10,
  "totalMaintenance": 95,
  "totalRevenue": 52500
}
```

### Get All Users (Admin Only)
**GET** `/admin/users` (Protected, Admin)

### Update User Role (Admin Only)
**PUT** `/admin/users/:id/role` (Protected, Admin)

**Request:**
```json
{
  "role": "mechanic"
}
```

**Valid Roles:** user, admin, mechanic

### Deactivate User (Admin Only)
**PUT** `/admin/users/:id/deactivate` (Protected, Admin)

### Get Revenue Report (Admin Only)
**GET** `/admin/reports/revenue?month=1&year=2023` (Protected, Admin)

## Error Responses

### Unauthorized (401)
```json
{
  "message": "No token provided"
}
```

### Forbidden (403)
```json
{
  "message": "Admin access required"
}
```

### Bad Request (400)
```json
{
  "message": "Bike already registered"
}
```

### Not Found (404)
```json
{
  "message": "Bike not found"
}
```

### Server Error (500)
```json
{
  "message": "Internal Server Error",
  "error": "Error details"
}
```

## Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer eyJhbGc...
```

Token expires in 7 days. Include in all protected endpoints.

## Rate Limiting

No rate limiting is currently implemented. Consider adding in production.

## CORS

The API accepts requests from:
- `http://localhost:3000` (development)
- Configure for production URLs in backend

## Testing with cURL

### Example Login Request
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Example Protected Request
```bash
curl -X GET http://localhost:5000/api/bikes \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
