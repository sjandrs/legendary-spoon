import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './TechnicianPayroll.css';

function TechnicianPayroll() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(id || '');
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchTechnicians();
    // Set default dates to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (selectedTechnicianId && startDate && endDate) {
      fetchPayrollData();
    }
  }, [selectedTechnicianId, startDate, endDate]);

  const fetchTechnicians = async () => {
    try {
      const response = await api.get('/api/technicians/');
      setTechnicians(response.data.results || response.data);
    } catch (_err) {
      console.error('Failed to fetch technicians:', _err);
    }
  };

  const fetchPayrollData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/technicians/${selectedTechnicianId}/payroll/`, {
        params: { start_date: startDate, end_date: endDate }
      });
      setPayrollData(response.data);
    } catch (_err) {
      setError('Failed to load payroll data');
      console.error(_err);
    } finally {
      setLoading(false);
    }
  };

  const selectedTechnician = technicians.find(t => t.id === parseInt(selectedTechnicianId));

  if (loading) {
    return (
      <div className="technician-payroll">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="technician-payroll">
      <div className="page-header">
        <h1>💰 Technician Payroll</h1>
        <button onClick={() => navigate('/technicians')} className="back-button">
          ← Back to Technicians
        </button>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Select Technician</label>
          <select
            value={selectedTechnicianId}
            onChange={(e) => setSelectedTechnicianId(e.target.value)}
            className="technician-select"
          >
            <option value="">-- Select Technician --</option>
            {technicians.map(tech => (
              <option key={tech.id} value={tech.id}>
                {tech.user?.username || tech.id} - {tech.specialty}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="date-input"
          />
        </div>

        <div className="filter-group">
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="date-input"
          />
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!selectedTechnicianId ? (
        <div className="empty-state">
          <div className="empty-icon">💰</div>
          <h3>Select a Technician</h3>
          <p>Choose a technician and date range to view payroll details</p>
        </div>
      ) : payrollData ? (
        <div className="payroll-content">
          <div className="technician-info-card">
            <h2>{selectedTechnician?.user?.username}</h2>
            <div className="info-row">
              <span>Specialty:</span>
              <strong>{selectedTechnician?.specialty}</strong>
            </div>
            <div className="info-row">
              <span>Hourly Rate:</span>
              <strong>${payrollData.hourly_rate?.toFixed(2)}</strong>
            </div>
          </div>

          <div className="payroll-summary">
            <div className="summary-card">
              <div className="card-icon">⏱️</div>
              <div className="card-content">
                <h3>Total Hours</h3>
                <p className="value">{payrollData.total_hours?.toFixed(2)}</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">💵</div>
              <div className="card-content">
                <h3>Billable Hours</h3>
                <p className="value">{payrollData.billable_hours?.toFixed(2)}</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">🕐</div>
              <div className="card-content">
                <h3>Non-Billable Hours</h3>
                <p className="value">{payrollData.non_billable_hours?.toFixed(2)}</p>
              </div>
            </div>

            <div className="summary-card highlight">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <h3>Total Payroll</h3>
                <p className="value">${payrollData.total_payroll?.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {payrollData.time_entries && payrollData.time_entries.length > 0 && (
            <div className="time-entries-section">
              <h3>📋 Time Entries Detail</h3>
              <table className="entries-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Project</th>
                    <th>Hours</th>
                    <th>Billable</th>
                    <th>Amount</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollData.time_entries.map((entry, index) => (
                    <tr key={index}>
                      <td>{new Date(entry.date).toLocaleDateString()}</td>
                      <td>{entry.project_name || 'N/A'}</td>
                      <td>{entry.hours?.toFixed(2)}</td>
                      <td>
                        <span className={`billable-badge ${entry.billable ? 'yes' : 'no'}`}>
                          {entry.billable ? '✓ Yes' : '✗ No'}
                        </span>
                      </td>
                      <td>${(entry.hours * payrollData.hourly_rate).toFixed(2)}</td>
                      <td>{entry.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default TechnicianPayroll;
