import React, { useState, useEffect } from 'react';
import { maintenanceAPI, bikeAPI } from '../utils/api';

const MaintenanceHistory = () => {
  const [bikes, setBikes] = useState([]);
  const [selectedBike, setSelectedBike] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBikes();
  }, []);

  const fetchBikes = async () => {
    try {
      const response = await bikeAPI.getUserBikes();
      setBikes(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch bikes');
      setLoading(false);
    }
  };

  const fetchHistory = async (bikeId) => {
    try {
      const response = await maintenanceAPI.getBikeMaintenanceHistory(bikeId);
      setHistory(response.data);
    } catch (err) {
      setError('Failed to fetch maintenance history');
    }
  };

  const handleBikeChange = (e) => {
    const bikeId = e.target.value;
    setSelectedBike(bikeId);
    if (bikeId) {
      fetchHistory(bikeId);
    }
  };

  if (loading) return <div className="container"><div className="loading"><div className="spinner"></div></div></div>;

  return (
    <div className="container">
      <h1>Maintenance History</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="form-group">
          <label>Select Bike to View History</label>
          <select value={selectedBike} onChange={handleBikeChange}>
            <option value="">Choose a bike...</option>
            {bikes.map(bike => (
              <option key={bike._id} value={bike._id}>
                {bike.registrationNumber} - {bike.manufacturer} {bike.model}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedBike && (
        <>
          {history.length > 0 ? (
            <div>
              {history.map(record => (
                <div key={record._id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <h3>{record.serviceType}</h3>
                      <p><strong>Date:</strong> {new Date(record.createdAt).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> <span className="badge badge-success">{record.status}</span></p>
                      <p><strong>Mileage:</strong> {record.mileage} km</p>
                      <p><strong>Cost:</strong> ₹{record.cost}</p>
                    </div>
                    <div>
                      <p><strong>Mechanic:</strong> {record.mechanic?.name || 'N/A'}</p>
                      <p><strong>Parts Used:</strong> {record.partsUsed || 'N/A'}</p>
                      {record.nextMaintenanceSchedule && (
                        <p><strong>Next Service:</strong> {new Date(record.nextMaintenanceSchedule).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  {record.description && <p><strong>Description:</strong> {record.description}</p>}
                  {record.notes && <p><strong>Notes:</strong> {record.notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <p>No maintenance records found for this bike.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MaintenanceHistory;
