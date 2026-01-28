import React, { useState, useEffect } from 'react';
import { adminAPI, bookingAPI, userAPI } from '../utils/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingStatus, setBookingStatus] = useState('');
  const [mechanic, setMechanic] = useState('');
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        bookingAPI.getAllBookings()
      ]);
      setStats(statsRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingStatusUpdate = async (bookingId) => {
    if (!bookingStatus) {
      setError('Please select a status');
      return;
    }

    try {
      await bookingAPI.updateBookingStatus(bookingId, {
        status: bookingStatus,
        mechanic: mechanic || undefined
      });
      setSelectedBooking(null);
      setBookingStatus('');
      setMechanic('');
      fetchDashboardData();
    } catch (err) {
      setError('Failed to update booking');
    }
  };

  if (loading) return <div className="container"><div className="loading"><div className="spinner"></div></div></div>;

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #ddd', paddingBottom: '1rem' }}>
        <button
          className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
        <button
          className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('bookings')}
        >
          Bookings
        </button>
      </div>

      {activeTab === 'stats' && stats && (
        <div>
          <div className="grid">
            <div className="stat-card">
              <h3>Total Users</h3>
              <div className="number">{stats.totalUsers}</div>
            </div>
            <div className="stat-card">
              <h3>Total Bikes</h3>
              <div className="number">{stats.totalBikes}</div>
            </div>
            <div className="stat-card">
              <h3>Total Bookings</h3>
              <div className="number">{stats.totalBookings}</div>
            </div>
            <div className="stat-card">
              <h3>Completed Bookings</h3>
              <div className="number">{stats.completedBookings}</div>
            </div>
            <div className="stat-card">
              <h3>Pending Bookings</h3>
              <div className="number">{stats.pendingBookings}</div>
            </div>
            <div className="stat-card">
              <h3>Total Revenue</h3>
              <div className="number">₹{stats.totalRevenue}</div>
            </div>
            <div className="stat-card">
              <h3>Maintenance Records</h3>
              <div className="number">{stats.totalMaintenance}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div>
          <h2>All Service Bookings</h2>
          {bookings.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Bike</th>
                  <th>Booking Date</th>
                  <th>Status</th>
                  <th>Cost</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking._id}>
                    <td>{booking.userId?.name}</td>
                    <td>{booking.bikeId?.registrationNumber}</td>
                    <td>{new Date(booking.bookingDate).toLocaleDateString()}</td>
                    <td><span className={`badge badge-${booking.status === 'completed' ? 'success' : 'pending'}`}>{booking.status}</span></td>
                    <td>₹{booking.totalCost}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No bookings found.</p>
          )}

          {selectedBooking && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h2>Update Booking Status</h2>
                  <button className="modal-close" onClick={() => setSelectedBooking(null)}>✕</button>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)}>
                    <option value="">Select Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Mechanic ID (Optional)</label>
                  <input
                    type="text"
                    value={mechanic}
                    onChange={(e) => setMechanic(e.target.value)}
                    placeholder="Enter mechanic ID"
                  />
                </div>
                <button
                  className="btn btn-success"
                  onClick={() => handleBookingStatusUpdate(selectedBooking._id)}
                >
                  Update
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
