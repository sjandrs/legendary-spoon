import React, { useState, useEffect } from 'react';
import { getTimeEntries, createTimeEntry, updateTimeEntry, deleteTimeEntry, getProjects } from '../api';
import './TimeTracking.css';

const TimeTracking = () => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    project: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    billable: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [entriesResponse, projectsResponse] = await Promise.all([
        getTimeEntries(),
        getProjects()
      ]);
      setTimeEntries(entriesResponse.data);
      setProjects(projectsResponse.data);
    } catch (err) {
      setError('Failed to fetch time tracking data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        hours: parseFloat(formData.hours)
      };

      if (editingEntry) {
        await updateTimeEntry(editingEntry.id, data);
      } else {
        await createTimeEntry(data);
      }

      fetchData();
      resetForm();
    } catch (err) {
      setError('Failed to save time entry');
      console.error(err);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      project: entry.project,
      date: entry.date,
      hours: entry.hours.toString(),
      description: entry.description,
      billable: entry.billable
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      try {
        await deleteTimeEntry(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete time entry');
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      project: '',
      date: new Date().toISOString().split('T')[0],
      hours: '',
      description: '',
      billable: true
    });
    setEditingEntry(null);
    setShowForm(false);
  };

  const calculateTotalHours = () => {
    return timeEntries.reduce((total, entry) => total + entry.hours, 0);
  };

  const calculateBillableHours = () => {
    return timeEntries
      .filter(entry => entry.billable)
      .reduce((total, entry) => total + entry.hours, 0);
  };

  if (loading) return <div>Loading time tracking...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="time-tracking">
      <div className="time-tracking-header">
        <h1>Time Tracking</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Log Time'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="time-summary">
        <div className="summary-card">
          <h3>Total Hours</h3>
          <p className="summary-value">{calculateTotalHours().toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Billable Hours</h3>
          <p className="summary-value">{calculateBillableHours().toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Billable Rate</h3>
          <p className="summary-value">
            {calculateTotalHours() > 0
              ? ((calculateBillableHours() / calculateTotalHours()) * 100).toFixed(1)
              : 0}%
          </p>
        </div>
      </div>

      {/* Time Entry Form */}
      {showForm && (
        <div className="time-entry-form">
          <h2>{editingEntry ? 'Edit Time Entry' : 'Log New Time Entry'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Project:</label>
              <select
                value={formData.project}
                onChange={(e) => setFormData({...formData, project: e.target.value})}
                required
              >
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date:</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Hours:</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={formData.hours}
                onChange={(e) => setFormData({...formData, hours: e.target.value})}
                placeholder="2.5"
                required
              />
            </div>

            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="What did you work on?"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.billable}
                  onChange={(e) => setFormData({...formData, billable: e.target.checked})}
                />
                Billable
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingEntry ? 'Update Entry' : 'Save Entry'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Time Entries List */}
      <div className="time-entries-list">
        <h2>Time Entries</h2>
        {timeEntries.length === 0 ? (
          <p>No time entries found. Start by logging your first entry!</p>
        ) : (
          <div className="striped-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Description</th>
                  <th>Hours</th>
                  <th>Billable</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {timeEntries.map(entry => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.date).toLocaleDateString()}</td>
                    <td>{entry.project_title || 'Unknown Project'}</td>
                    <td>{entry.description}</td>
                    <td>{entry.hours}</td>
                    <td>
                      <span className={entry.billable ? 'billable-yes' : 'billable-no'}>
                        {entry.billable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => handleEdit(entry)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleDelete(entry.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeTracking;
