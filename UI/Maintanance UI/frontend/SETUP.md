# Frontend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
Create `.env` file from `.env.example`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Start Development Server
```bash
npm start
```

The app will open on `http://localhost:3000`

## Key Features

### Pages
- **Login/Register**: User authentication
- **Dashboard**: User home with quick actions
- **My Bikes**: Register and manage bikes
- **Book Service**: Browse and book services
- **My Bookings**: View service booking history
- **Maintenance History**: View detailed maintenance records
- **Admin Dashboard**: Admin statistics and management

### Components
- **Navbar**: Navigation with user menu and logout

### Utilities
- **api.js**: API client with Axios interceptors for token management

### Context
- **AuthContext**: Global authentication state management

## Development

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### File Structure
```
src/
├── components/      # Reusable React components
├── pages/          # Full page components
├── utils/          # Helper functions and API client
├── context/        # React Context providers
├── App.js          # Main app component with routing
├── App.css         # Global styles
└── index.js        # Entry point
```

## Styling

The application uses a custom CSS framework with:
- Card-based layouts
- Button variants (primary, success, danger)
- Form styling
- Table styling
- Badge styling
- Modal overlays
- Responsive grid

## API Integration

All API calls go through the `api.js` utility which:
- Uses Axios for HTTP requests
- Automatically adds JWT tokens to requests
- Handles base URL configuration
- Provides organized API namespaces

### Usage Example
```javascript
import { bikeAPI, bookingAPI } from '../utils/api';

// Add a bike
const response = await bikeAPI.addBike({
  registrationNumber: 'ABC123',
  manufacturer: 'Honda',
  model: 'CB500F',
  year: 2023
});

// Create a booking
const response = await bookingAPI.createBooking({
  bikeId: 'bike_id',
  serviceIds: ['service_1', 'service_2'],
  bookingDate: new Date(),
  notes: 'Some notes'
});
```

## Authentication Flow

1. User registers or logs in
2. Backend returns JWT token and user data
3. Token stored in localStorage
4. AuthContext provides user data throughout app
5. Private routes check authentication
6. Token automatically sent with API requests

## Troubleshooting

### API Connection Error
- Ensure backend is running on port 5000
- Check REACT_APP_API_URL in .env
- Clear browser cache and refresh

### Login Issues
- Verify credentials are correct
- Check backend error logs
- Ensure JWT_SECRET matches between frontend and backend

### Page Not Loading
- Check browser console for errors
- Verify token is still valid
- Clear localStorage and re-login

## Deployment

### Build Production Bundle
```bash
npm run build
```

### Deploy to Netlify/Vercel
1. Build the project
2. Deploy the `build/` folder
3. Set environment variables on the hosting platform
