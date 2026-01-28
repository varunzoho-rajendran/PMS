import React, { useState, useEffect } from 'react';
import { bookingAPI, serviceAPI, bikeAPI } from '../utils/api';

const BookService = () => {
  const [bikes, setBikes] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedBike, setSelectedBike] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [bookingDate, setBookingDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [bikesRes, servicesRes] = await Promise.all([
        bikeAPI.getUserBikes(),
        serviceAPI.getAllServices()
      ]);
      setBikes(bikesRes.data);
      setServices(servicesRes.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedBike || selectedServices.length === 0 || !bookingDate) {
      setError('Please fill all required fields');
      return;
    }

    try {
      await bookingAPI.createBooking({
        bikeId: selectedBike,
        serviceIds: selectedServices,
        bookingDate: new Date(bookingDate),
        notes
      });
      setSuccess('Service booking created successfully!');
      setSelectedBike('');
      setSelectedServices([]);
      setBookingDate('');
      setNotes('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    }
  };

  if (loading) return <div className="container"><div className="loading"><div className="spinner"></div></div></div>;

  const totalCost = services
    .filter(s => selectedServices.includes(s._id))
    .reduce((sum, s) => sum + s.estimatedCost, 0);

  return (
    <div className="container">
      <h1>Book a Service</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="grid">
        <div className="card">
          <h2>Booking Details</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Bike *</label>
              <select
                value={selectedBike}
                onChange={(e) => setSelectedBike(e.target.value)}
                required
              >
                <option value="">Choose a bike...</option>
                {bikes.map(bike => (
                  <option key={bike._id} value={bike._id}>
                    {bike.registrationNumber} - {bike.manufacturer} {bike.model}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Booking Date *</label>
              <input
                type="datetime-local"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or issues..."
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary">Book Service</button>
          </form>
        </div>

        <div className="card">
          <h2>Select Services</h2>
          <div style={{ marginBottom: '1rem' }}>
            {services.map(service => (
              <div key={service._id} style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service._id)}
                    onChange={() => handleServiceToggle(service._id)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span>
                    <strong>{service.name}</strong> - ₹{service.estimatedCost}
                  </span>
                </label>
                <small>{service.description}</small>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
            <h3>Estimated Total: ₹{totalCost}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookService;
