import React, { useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container"><div className="loading"><div className="spinner"></div></div></div>;

  return (
    <div className="container">
      <h1>Welcome, {user?.name}!</h1>
      {profile && (
        <div className="card">
          <h2>Your Profile</h2>
          <div className="grid">
            <div>
              <p><strong>Name:</strong> {profile.name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Phone:</strong> {profile.phone}</p>
            </div>
            <div>
              <p><strong>Address:</strong> {profile.address || 'N/A'}</p>
              <p><strong>City:</strong> {profile.city || 'N/A'}</p>
              <p><strong>Role:</strong> <span className="badge badge-success">{profile.role}</span></p>
            </div>
          </div>
        </div>
      )}
      <div className="card">
        <h2>Quick Actions</h2>
        <div className="grid">
          <a href="/my-bikes" className="btn btn-primary">View My Bikes</a>
          <a href="/book-service" className="btn btn-primary">Book Service</a>
          <a href="/my-bookings" className="btn btn-primary">My Bookings</a>
          <a href="/maintenance-history" className="btn btn-primary">Maintenance History</a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
