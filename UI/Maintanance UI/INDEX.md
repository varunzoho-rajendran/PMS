# 🏍️ Two Wheeler Maintenance & Service Application

## Welcome!

This is a complete, production-ready full-stack application for managing two-wheeler maintenance and service operations.

---

## 📋 Documentation Index

### Getting Started
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Quick setup guide (START HERE!)
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - What's been built overview

### Core Documentation
- **[README.md](./README.md)** - Complete project documentation
- **[API_REFERENCE.md](./API_REFERENCE.md)** - API endpoints and examples
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deploy to production

### Setup Guides
- **[backend/SETUP.md](./backend/SETUP.md)** - Backend-specific setup
- **[frontend/SETUP.md](./frontend/SETUP.md)** - Frontend-specific setup

---

## ⚡ Quick Start (5 minutes)

### 1. Backend Setup
```bash
cd backend
npm install
# Edit .env file with your MongoDB connection
npm start
```
Server runs on: `http://localhost:5000`

### 2. Frontend Setup
```bash
cd frontend
npm install
# Edit .env file
npm start
```
App opens on: `http://localhost:3000`

---

## 🎯 Key Features

### For Users
✅ Register and login securely
✅ Manage multiple bikes
✅ Book maintenance services
✅ Track booking status
✅ View maintenance history
✅ Update profile

### For Admins
✅ Dashboard with statistics
✅ User management
✅ Booking management
✅ Revenue reports
✅ Role management

---

## 📁 Project Structure

```
Maintanance UI/
├── backend/              # Node.js + Express API
│   ├── models/          # Database schemas
│   ├── controllers/      # Business logic
│   ├── routes/          # API endpoints
│   ├── middleware/       # Auth & validation
│   └── server.js        # Entry point
│
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Full page components
│   │   ├── utils/       # API client & helpers
│   │   └── context/     # State management
│   └── public/          # Static files
│
├── Documentation/
│   ├── README.md
│   ├── GETTING_STARTED.md
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT.md
│   └── PROJECT_SUMMARY.md
```

---

## 🛠️ Technology Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs Password Hashing

### Frontend
- React 18
- React Router
- Axios HTTP Client
- Context API for State

---

## 📱 Pages & Features

| Page | Features |
|------|----------|
| **Login/Register** | User authentication |
| **Dashboard** | Welcome & quick actions |
| **My Bikes** | Add, view, manage bikes |
| **Book Service** | Browse services & book |
| **My Bookings** | View booking status |
| **Maintenance History** | View service records |
| **Admin Dashboard** | Stats, user & booking management |

---

## 🔌 API Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile

### Bikes
- `POST /api/bikes` - Add bike
- `GET /api/bikes` - Get user's bikes
- `DELETE /api/bikes/:id` - Delete bike

### Services
- `GET /api/services` - List all services
- `POST /api/services` - Add service (Admin)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/user/my-bookings` - Get bookings
- `PUT /api/bookings/:id` - Update status (Admin)

### Admin
- `GET /api/admin/stats` - Get statistics
- `GET /api/admin/users` - List users
- `GET /api/admin/reports/revenue` - Revenue report

**Total: 31 API endpoints** (Full details in [API_REFERENCE.md](./API_REFERENCE.md))

---

## 🗄️ Database Models

- **User** - Registration, profile, roles
- **Bike** - Bike details, owner, status
- **Service** - Available services, pricing, duration
- **Booking** - Service requests, status tracking
- **Maintenance** - Service records, history, costs

---

## 🔐 Security Features

✅ Password hashing with bcryptjs
✅ JWT token authentication
✅ Role-based access control
✅ Protected API routes
✅ CORS enabled
✅ Token expiration (7 days)

---

## 📚 Documentation Guide

### New to the Project?
1. Start with [GETTING_STARTED.md](./GETTING_STARTED.md)
2. Follow the setup instructions
3. Run the application
4. Read [README.md](./README.md) for details

### Need API Details?
→ Check [API_REFERENCE.md](./API_REFERENCE.md)

### Want to Deploy?
→ Follow [DEPLOYMENT.md](./DEPLOYMENT.md)

### Backend Questions?
→ See [backend/SETUP.md](./backend/SETUP.md)

### Frontend Questions?
→ See [frontend/SETUP.md](./frontend/SETUP.md)

---

## 🚀 Getting Started Now!

### Step 1: Read Setup Guide
Open [GETTING_STARTED.md](./GETTING_STARTED.md)

### Step 2: Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Step 3: Configure Environment
Create `.env` files in both directories

### Step 4: Start Application
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm start
```

### Step 5: Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## 📞 Support

All documentation is included. Check:
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Setup issues
- [README.md](./README.md) - General info
- [API_REFERENCE.md](./API_REFERENCE.md) - API questions
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment help

---

## ✨ Features Checklist

### Core Features
✅ User authentication (JWT)
✅ Bike management
✅ Service booking system
✅ Maintenance tracking
✅ Booking history
✅ Admin dashboard

### Advanced Features
✅ Role-based access (User, Admin, Mechanic)
✅ Service cost calculation
✅ Revenue reporting
✅ User management
✅ Status tracking

### Technical Features
✅ RESTful API design
✅ Middleware authentication
✅ Database validation
✅ Error handling
✅ CORS support
✅ Responsive design

---

## 🎓 Learning Path

1. **Understand the Architecture**
   - Read [README.md](./README.md)

2. **Setup the Project**
   - Follow [GETTING_STARTED.md](./GETTING_STARTED.md)

3. **Explore the Code**
   - Backend: Look at controllers and routes
   - Frontend: Look at pages and components

4. **Test the API**
   - Use the examples in [API_REFERENCE.md](./API_REFERENCE.md)

5. **Customize**
   - Modify styles in `frontend/src/App.css`
   - Add new features
   - Deploy to production

---

## 📊 Project Statistics

- **Total Files:** 50+
- **Backend Files:** 25+
- **Frontend Files:** 15+
- **Documentation Files:** 6
- **API Endpoints:** 31
- **Database Models:** 5
- **React Pages:** 8
- **React Components:** 1+

---

## 🎯 What's Included

✅ Complete backend API
✅ Complete React frontend
✅ Database models & schemas
✅ Authentication system
✅ Role-based access control
✅ Admin dashboard
✅ Comprehensive documentation
✅ Setup guides
✅ Deployment guides
✅ API reference
✅ Styling & UI
✅ Error handling

---

## 🚀 Ready to Launch?

Everything is ready! Choose your next step:

1. **Just Getting Started?**
   → Read [GETTING_STARTED.md](./GETTING_STARTED.md)

2. **Want Full Details?**
   → Read [README.md](./README.md)

3. **Need API Info?**
   → Check [API_REFERENCE.md](./API_REFERENCE.md)

4. **Ready to Deploy?**
   → Follow [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📄 Files in This Directory

| File | Purpose |
|------|---------|
| INDEX.md (this file) | Navigation & quick reference |
| README.md | Complete project documentation |
| GETTING_STARTED.md | Setup & usage guide |
| PROJECT_SUMMARY.md | What's been built |
| API_REFERENCE.md | API endpoints & examples |
| DEPLOYMENT.md | Production deployment |
| backend/ | Node.js API server |
| frontend/ | React web application |

---

**Happy coding! 🚀**

For questions, check the documentation files above. Everything you need is included!
