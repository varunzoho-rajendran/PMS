# Two Wheeler Maintenance and Service Application

A comprehensive full-stack application for managing two-wheeler (motorcycle/bike) maintenance and service operations with React frontend and Node.js backend.

## Features

### User Features
- **User Authentication**: Secure registration and login with JWT
- **Bike Management**: Register and manage multiple bikes
- **Service Booking**: Book maintenance and service appointments
- **Booking History**: Track all service bookings and their status
- **Maintenance Records**: View complete maintenance history for each bike
- **Profile Management**: Update personal and contact information

### Admin Features
- **Dashboard Statistics**: View overall system metrics
  - Total users, bikes, and bookings
  - Completed and pending bookings
  - Revenue tracking
- **Booking Management**: Update booking status and assign mechanics
- **User Management**: Manage user roles and deactivate accounts
- **Revenue Reports**: Generate revenue reports by service type

## Project Structure

```
two-wheeler-maintenance/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Bike.js
│   │   ├── Service.js
│   │   ├── Booking.js
│   │   └── Maintenance.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── bikeController.js
│   │   ├── bookingController.js
│   │   ├── serviceController.js
│   │   ├── maintenanceController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bikeRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── maintenanceRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── Navbar.js
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── Dashboard.js
    │   │   ├── MyBikes.js
    │   │   ├── BookService.js
    │   │   ├── MyBookings.js
    │   │   ├── MaintenanceHistory.js
    │   │   └── AdminDashboard.js
    │   ├── utils/
    │   │   └── api.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── App.js
    │   ├── App.css
    │   └── index.js
    ├── package.json
    └── .env.example
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/two-wheeler-maintenance
JWT_SECRET=your_jwt_secret_key_here
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

4. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm start
```

The frontend will open on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Bikes
- `POST /api/bikes` - Add a new bike
- `GET /api/bikes` - Get user's bikes
- `GET /api/bikes/:id` - Get bike details
- `PUT /api/bikes/:id` - Update bike
- `DELETE /api/bikes/:id` - Delete bike

### Services
- `GET /api/services` - Get all available services
- `GET /api/services/:id` - Get service details
- `POST /api/services` - Create service (Admin)
- `PUT /api/services/:id` - Update service (Admin)
- `DELETE /api/services/:id` - Delete service (Admin)

### Bookings
- `POST /api/bookings` - Create a service booking
- `GET /api/bookings/user/my-bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking status (Admin)
- `GET /api/bookings/admin/all` - Get all bookings (Admin)

### Maintenance
- `POST /api/maintenance` - Create maintenance record (Mechanic/Admin)
- `GET /api/maintenance/history/:bikeId` - Get bike maintenance history
- `GET /api/maintenance/:id` - Get maintenance record details
- `PUT /api/maintenance/:id` - Update maintenance record (Mechanic/Admin)
- `GET /api/maintenance/admin/all` - Get all maintenance records (Mechanic/Admin)

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `PUT /api/admin/users/:id/deactivate` - Deactivate user
- `GET /api/admin/reports/revenue` - Get revenue report

## Database Models

### User
- name, email, phone, password (hashed)
- address, city
- role (user, admin, mechanic)
- isActive, timestamps

### Bike
- registrationNumber, manufacturer, model, year
- engineNumber, chassisNumber
- fuelType, color, mileage
- lastServiceDate, nextServiceDate
- status (active, inactive, under_maintenance)
- userId (reference to User)

### Service
- name, description
- estimatedCost, estimatedDuration
- category (maintenance, repair, inspection, custom)
- isActive, timestamps

### Booking
- userId, bikeId, serviceIds[]
- bookingDate, estimatedCompletionDate, actualCompletionDate
- status (pending, confirmed, in_progress, completed, cancelled)
- totalCost, notes, mechanic
- timestamps

### Maintenance
- bikeId, bookingId
- serviceType, description, partsUsed
- mileage, cost, mechanic
- status (pending, in_progress, completed)
- images[], nextMaintenanceSchedule
- notes, timestamps

## Key Technologies

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **CORS** - Cross-origin support

### Frontend
- **React** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Context API** - State management

## User Roles

### User
- Register and manage bikes
- Book services
- View bookings and maintenance history
- Update profile

### Admin
- View dashboard statistics
- Manage all bookings
- Manage users and their roles
- View revenue reports

### Mechanic
- View and update service bookings
- Create and manage maintenance records
- View maintenance history

## Security Features
- Password hashing with bcryptjs
- JWT-based authentication
- Role-based access control
- Middleware-based authorization
- CORS protection

## Future Enhancements
- Email notifications for booking confirmations
- SMS reminders for scheduled services
- Payment integration
- Service reminder notifications
- Photo upload for maintenance records
- Mileage tracking and alerts
- Service cost estimation
- Customer ratings and reviews
- Inventory management for spare parts
- Mobile app (React Native)

## License
MIT
