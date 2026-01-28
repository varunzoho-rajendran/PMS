# Installation and Getting Started Guide

## System Requirements

- Node.js v14.0 or higher
- npm v6.0 or higher
- MongoDB (local or cloud)
- A code editor (VS Code recommended)
- Git (optional)

## Installation Steps

### Step 1: Backend Setup

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file:**
   Create a file named `.env` with the following content:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/two-wheeler-maintenance
   JWT_SECRET=your_jwt_secret_key_change_this_in_production
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=admin123
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   ```

4. **Ensure MongoDB is running:**
   - For local MongoDB, open terminal and run: `mongod`
   - For MongoDB Atlas, update MONGODB_URI with your connection string

5. **Start the backend server:**
   ```bash
   npm start
   ```
   
   You should see: `Server is running on port 5000`

### Step 2: Frontend Setup

1. **In a new terminal, navigate to frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file:**
   Create a file named `.env`:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the frontend server:**
   ```bash
   npm start
   ```
   
   React will automatically open the app in your browser at `http://localhost:3000`

## First Time Usage

### Create Admin Account

1. Go to `http://localhost:3000/register`
2. Fill in the registration form
3. Update the user role to 'admin' in MongoDB:
   ```bash
   # In MongoDB shell or GUI
   db.users.updateOne(
     { email: "your_email@gmail.com" },
     { $set: { role: "admin" } }
   )
   ```

### Add Services

1. Login with admin account
2. You need to add services through MongoDB or create an admin service panel
3. Example service in MongoDB:
   ```bash
   db.services.insertOne({
     name: "Basic Maintenance",
     description: "Oil change, filter replacement",
     estimatedCost: 500,
     estimatedDuration: 30,
     category: "maintenance",
     isActive: true,
     createdAt: new Date(),
     updatedAt: new Date()
   })
   ```

### Register a Bike

1. Login as a regular user
2. Go to "My Bikes"
3. Click "Add Bike"
4. Fill in bike details
5. Click "Add Bike" to save

### Book a Service

1. Go to "Book Service"
2. Select your bike
3. Select services you want
4. Choose booking date and time
5. Click "Book Service"

## Project Overview

### Backend Technology Stack
- **Express.js** - Web server framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **bcryptjs** - Password encryption

### Frontend Technology Stack
- **React** - UI library
- **React Router** - Page navigation
- **Axios** - HTTP requests
- **Context API** - State management
- **CSS3** - Styling

## Common Issues and Solutions

### Issue: Backend fails to start
**Solution:**
- Check if MongoDB is running
- Verify MONGODB_URI in .env is correct
- Check if port 5000 is already in use
  
### Issue: Frontend cannot connect to backend
**Solution:**
- Ensure backend is running on port 5000
- Check REACT_APP_API_URL in .env is correct
- Open browser DevTools → Network tab to check API calls

### Issue: Login fails with invalid credentials
**Solution:**
- Verify username and password are correct
- Check if user was created successfully
- Look at backend console for error messages

### Issue: Cannot add bike (registration number already exists)
**Solution:**
- Use a different registration number
- Check if you already registered this bike

## Development Workflow

### Adding a New Feature

1. **Plan the feature**
   - Decide which component/page needs modification
   - Plan backend API endpoint if needed

2. **Backend Development**
   - Create/modify controller function
   - Add/update route
   - Test with Postman or curl

3. **Frontend Development**
   - Create/modify component
   - Add API call using api.js
   - Test in React app

4. **Testing**
   - Test complete workflow
   - Check error handling
   - Test on different screen sizes

## File Locations

### Important Files
- Backend API routes: `backend/routes/`
- Frontend pages: `frontend/src/pages/`
- Database models: `backend/models/`
- API client: `frontend/src/utils/api.js`
- Styles: `frontend/src/App.css`

## Next Steps

1. **Customize UI** - Modify `App.css` for your brand colors
2. **Add more services** - Add service records to MongoDB
3. **Create more features** - Add new pages and API endpoints
4. **Deploy** - Deploy backend to Heroku/AWS, frontend to Netlify/Vercel

## Useful Commands

### Backend
```bash
# Start with auto-reload
npm run dev

# Start normally
npm start

# Install new package
npm install package-name
```

### Frontend
```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Support

For issues and questions:
1. Check the README.md for detailed documentation
2. Review error messages in browser console and backend logs
3. Check API responses in browser DevTools
4. Review database documents in MongoDB

---

**Congratulations!** Your Two Wheeler Maintenance Application is now ready to use! 🎉
