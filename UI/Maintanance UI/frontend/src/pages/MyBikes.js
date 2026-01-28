import React, { useState, useEffect } from 'react';
import { bikeAPI } from '../utils/api';

const MyBikes = () => {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    manufacturer: '',
    model: '',
    year: new Date().getFullYear(),
    engineNumber: '',
    chassisNumber: '',
    fuelType: 'petrol',
    color: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBikes();
  }, []);

  const fetchBikes = async () => {
    try {
      const response = await bikeAPI.getUserBikes();
      setBikes(response.data);
    } catch (err) {
      setError('Failed to fetch bikes');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await bikeAPI.addBike(formData);
      setFormData({
        registrationNumber: '',
        manufacturer: '',
        model: '',
        year: new Date().getFullYear(),
        engineNumber: '',
        chassisNumber: '',
        fuelType: 'petrol',
        color: ''
      });
      setShowForm(false);
      fetchBikes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add bike');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bike?')) {
      try {
        await bikeAPI.deleteBike(id);
        fetchBikes();
      } catch (err) {
        setError('Failed to delete bike');
      }
    }
  };

  if (loading) return <div className="container"><div className="loading"><div className="spinner"></div></div></div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>My Bikes</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Bike'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card">
          <h2>Add New Bike</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid">
              <div className="form-group">
                <label>Registration Number *</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Manufacturer</label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Engine Number</label>
                <input
                  type="text"
                  name="engineNumber"
                  value={formData.engineNumber}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Chassis Number</label>
                <input
                  type="text"
                  name="chassisNumber"
                  value={formData.chassisNumber}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Fuel Type</label>
                <select name="fuelType" value={formData.fuelType} onChange={handleChange}>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                </select>
              </div>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-success">Add Bike</button>
          </form>
        </div>
      )}

      {bikes.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Registration Number</th>
              <th>Manufacturer</th>
              <th>Model</th>
              <th>Year</th>
              <th>Fuel Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bikes.map((bike) => (
              <tr key={bike._id}>
                <td>{bike.registrationNumber}</td>
                <td>{bike.manufacturer}</td>
                <td>{bike.model}</td>
                <td>{bike.year}</td>
                <td>{bike.fuelType}</td>
                <td><span className="badge badge-success">{bike.status}</span></td>
                <td>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(bike._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="card">
          <p>No bikes registered yet. <a href="#" onClick={() => setShowForm(true)}>Add one now!</a></p>
        </div>
      )}
    </div>
  );
};

export default MyBikes;
