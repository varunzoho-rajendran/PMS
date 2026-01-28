import React, { useState, useEffect } from 'react';
import { bookingAPI } from '../utils/api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await bookingAPI.getUserBookings();
      setBookings(response.data);
    } catch (err) {
      setError('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container"><div className="loading"><div className="spinner"></div></div></div>;

  return (
    <div className="container">
      <h1>My Service Bookings</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {bookings.length > 0 ? (
        <div>
          {bookings.map(booking => (
            <div key={booking._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>{booking.bikeId?.registrationNumber}</h3>
                  <p><strong>Booking Date:</strong> {new Date(booking.bookingDate).toLocaleString()}</p>
                  <p><strong>Status:</strong> <span className={`badge badge-${booking.status === 'completed' ? 'success' : 'pending'}`}>{booking.status.toUpperCase()}</span></p>
                  <p><strong>Total Cost:</strong> ₹{booking.totalCost}</p>
                  {booking.mechanic && <p><strong>Mechanic:</strong> {booking.mechanic.name}</p>}
                </div>
                <div>
                  <p><strong>Services:</strong></p>
                  <ul>
                    {booking.serviceIds?.map(service => (
                      <li key={service._id}>{service.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <p>No bookings found. <a href="/book-service">Book a service now!</a></p>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
