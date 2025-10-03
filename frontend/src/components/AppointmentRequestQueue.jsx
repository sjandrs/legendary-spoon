import React, { useState, useEffect } from 'react';
import api from '../api';
import './AppointmentRequestQueue.css';

const AppointmentRequestQueue = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    technician: '',
    scheduled_date: '',
    estimated_duration: '60',
    notes: ''
  });

  useEffect(() => {
    loadRequests();
    loadTechnicians();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [requests, filter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/appointment-requests/');
      const requestData = response.data.results || response.data;
      setRequests(requestData);
    } catch (error) {
      console.error('Error loading appointment requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      const response = await api.get('/api/technicians/');
      setTechnicians(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  const applyFilter = () => {
    let filtered = requests;

    switch (filter) {
      case 'pending':
        filtered = requests.filter(r => r.status === 'pending');
        break;
      case 'approved':
        filtered = requests.filter(r => r.status === 'approved');
        break;
      case 'scheduled':
        filtered = requests.filter(r => r.status === 'scheduled');
        break;
      case 'emergency':
        filtered = requests.filter(r => r.urgency_level === 'emergency');
        break;
      case 'high_priority':
        filtered = requests.filter(r => r.urgency_level === 'high');
        break;
      default:
        filtered = requests;
    }

    // Sort by urgency and submission date
    filtered.sort((a, b) => {
      const urgencyOrder = { emergency: 4, high: 3, normal: 2, low: 1 };
      const urgencyA = urgencyOrder[a.urgency_level] || 0;
      const urgencyB = urgencyOrder[b.urgency_level] || 0;

      if (urgencyA !== urgencyB) {
        return urgencyB - urgencyA;
      }

      return new Date(a.submitted_at) - new Date(b.submitted_at);
    });

    setFilteredRequests(filtered);
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      await api.patch(`/api/appointment-requests/${requestId}/`, {
        status: newStatus,
        updated_at: new Date().toISOString()
      });
      loadRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const handleScheduleAppointment = (request) => {
    setSelectedRequest(request);
    setScheduleForm({
      technician: '',
      scheduled_date: request.preferred_date ? `${request.preferred_date}T${request.preferred_time || '09:00'}` : '',
      estimated_duration: '60',
      notes: ''
    });
    setShowScheduleModal(true);
  };

  const handleConfirmSchedule = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update the appointment request
      await api.patch(`/api/appointment-requests/${selectedRequest.id}/`, {
        status: 'scheduled',
        assigned_technician: scheduleForm.technician,
        updated_at: new Date().toISOString()
      });

      // Create the scheduled event
      await api.post('/api/scheduled-events/', {
        title: `${selectedRequest.service_type} - ${selectedRequest.customer_name}`,
        description: selectedRequest.description,
        scheduled_date: scheduleForm.scheduled_date,
        estimated_end_time: calculateEndTime(scheduleForm.scheduled_date, scheduleForm.estimated_duration),
        technician: scheduleForm.technician,
        customer_name: selectedRequest.customer_name,
        customer_phone: selectedRequest.customer_phone,
        customer_email: selectedRequest.customer_email,
        address: selectedRequest.customer_address,
        status: 'scheduled',
        notes: scheduleForm.notes
      });

      setShowScheduleModal(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error) {
      console.error('Error scheduling appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (startDateTime, durationMinutes) => {
    const start = new Date(startDateTime);
    const end = new Date(start.getTime() + (parseInt(durationMinutes) * 60000));
    return end.toISOString();
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      emergency: '#ef4444',
      high: '#f59e0b',
      normal: '#3b82f6',
      low: '#10b981'
    };
    return colors[urgency] || '#6b7280';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#3b82f6',
      scheduled: '#10b981',
      rejected: '#ef4444',
      completed: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="appointment-queue">
      <div className="queue-header">
        <h1>Appointment Request Queue</h1>
        <div className="queue-stats">
          <div className="stat">
            <span className="stat-number">{requests.filter(r => r.status === 'pending').length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat">
            <span className="stat-number">{requests.filter(r => r.urgency_level === 'emergency').length}</span>
            <span className="stat-label">Emergency</span>
          </div>
          <div className="stat">
            <span className="stat-number">{requests.filter(r => r.status === 'scheduled').length}</span>
            <span className="stat-label">Scheduled</span>
          </div>
        </div>
      </div>

      <div className="queue-filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({requests.length})
        </button>
        <button
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Pending ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button
          className={filter === 'emergency' ? 'active' : ''}
          onClick={() => setFilter('emergency')}
        >
          Emergency ({requests.filter(r => r.urgency_level === 'emergency').length})
        </button>
        <button
          className={filter === 'high_priority' ? 'active' : ''}
          onClick={() => setFilter('high_priority')}
        >
          High Priority ({requests.filter(r => r.urgency_level === 'high').length})
        </button>
        <button
          className={filter === 'scheduled' ? 'active' : ''}
          onClick={() => setFilter('scheduled')}
        >
          Scheduled ({requests.filter(r => r.status === 'scheduled').length})
        </button>
      </div>

      <div className="requests-list">
        {loading ? (
          <div className="loading">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="no-requests">No appointment requests found.</div>
        ) : (
          filteredRequests.map(request => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <div className="request-customer">
                  <h3>{request.customer_name}</h3>
                  <p>{request.customer_phone} • {request.customer_email}</p>
                </div>
                <div className="request-badges">
                  <span
                    className="urgency-badge"
                    style={{ backgroundColor: getUrgencyColor(request.urgency_level) }}
                  >
                    {request.urgency_level.toUpperCase()}
                  </span>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(request.status) }}
                  >
                    {request.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="request-details">
                <div className="request-info">
                  <p><strong>Service:</strong> {request.service_type?.replace(/_/g, ' ').toUpperCase()}</p>
                  <p><strong>Address:</strong> {request.customer_address}</p>
                  <p><strong>Preferred Time:</strong> {request.preferred_date} {request.preferred_time ? `at ${request.preferred_time}` : ''}</p>
                  <p><strong>Submitted:</strong> {formatDateTime(request.submitted_at)}</p>
                </div>

                <div className="request-description">
                  <p><strong>Description:</strong></p>
                  <p>{request.description}</p>
                  {request.additional_notes && (
                    <>
                      <p><strong>Additional Notes:</strong></p>
                      <p>{request.additional_notes}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="request-actions">
                {request.status === 'pending' && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => handleUpdateStatus(request.id, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleScheduleAppointment(request)}
                    >
                      Schedule
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleUpdateStatus(request.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </>
                )}
                {request.status === 'approved' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleScheduleAppointment(request)}
                  >
                    Schedule Appointment
                  </button>
                )}
                {request.status === 'scheduled' && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleUpdateStatus(request.id, 'completed')}
                  >
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Schedule Appointment - {selectedRequest.customer_name}</h3>
              <button
                className="modal-close"
                onClick={() => setShowScheduleModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleConfirmSchedule}>
              <div className="form-group">
                <label htmlFor="assigned-technician">Assigned Technician</label>
                <select
                  id="assigned-technician"
                  value={scheduleForm.technician}
                  onChange={(e) => setScheduleForm({...scheduleForm, technician: e.target.value})}
                  required
                >
                  <option value="">Select Technician</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.first_name} {tech.last_name} - {tech.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="scheduled-date-time">Scheduled Date & Time</label>
                <input
                  id="scheduled-date-time"
                  type="datetime-local"
                  value={scheduleForm.scheduled_date}
                  onChange={(e) => setScheduleForm({...scheduleForm, scheduled_date: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="estimated-duration">Estimated Duration (minutes)</label>
                <select
                  id="estimated-duration"
                  value={scheduleForm.estimated_duration}
                  onChange={(e) => setScheduleForm({...scheduleForm, estimated_duration: e.target.value})}
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                  <option value="240">4 hours</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="scheduling-notes">Scheduling Notes</label>
                <textarea
                  id="scheduling-notes"
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})}
                  rows="3"
                  placeholder="Any special instructions or notes for the technician..."
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentRequestQueue;
