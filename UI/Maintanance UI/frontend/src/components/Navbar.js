import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <h1>🏍️ Two Wheeler Maintenance</h1>
      <ul className="nav-links">
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/my-bikes">My Bikes</Link></li>
        <li><Link to="/book-service">Book Service</Link></li>
        <li><Link to="/my-bookings">My Bookings</Link></li>
        <li><Link to="/maintenance-history">Maintenance History</Link></li>
        {user?.role === 'admin' && <li><Link to="/admin">Admin</Link></li>}
        <li><span>{user?.name}</span></li>
        <li><button className="logout-btn" onClick={logout}>Logout</button></li>
      </ul>
    </nav>
  );
};

export default Navbar;
