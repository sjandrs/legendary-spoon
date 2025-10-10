import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import './ProjectTemplateForm.css';

function ProjectTemplateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimated_hours: '',
  });

  const [tasks, setTasks] = useState([
    { title: '', description: '', estimated_hours: '', order: 1 }
  ]);

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/project-templates/${id}/`);
      const template = response.data;
      setFormData({
        name: template.name || '',
        description: template.description || '',
        estimated_hours: template.estimated_hours || '',
      });
      if (template.tasks && template.tasks.length > 0) {
        setTasks(template.tasks);
      }
    } catch (_err) {
      setError('Failed to load template');
      console.error(_err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTaskChange = (index, field, value) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][field] = value;
    setTasks(updatedTasks);
  };

  const addTask = () => {
    setTasks([
      ...tasks,
      { title: '', description: '', estimated_hours: '', order: tasks.length + 1 }
    ]);
  };

  const removeTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        tasks: tasks.filter(task => task.title.trim() !== '')
      };

      if (id) {
        await api.put(`/api/project-templates/${id}/`, payload);
      } else {
        await api.post('/api/project-templates/', payload);
      }

      navigate('/project-templates');
    } catch (_err) {
      setError(_err.response?.data?.detail || 'Failed to save template');
      console.error(_err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="project-template-form">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-template-form">
      <div className="form-header">
        <h1>{id ? '✏️ Edit Template' : '➕ Create Template'}</h1>
        <button onClick={() => navigate('/project-templates')} className="back-button">
          ← Back to Templates
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="template-form">
        <div className="form-section">
          <h2>Template Details</h2>
          <div className="form-group">
            <label htmlFor="name">Template Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Website Redesign Project"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the purpose and scope of this template..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="estimated_hours">Estimated Total Hours</label>
            <input
              type="number"
              id="estimated_hours"
              name="estimated_hours"
              value={formData.estimated_hours}
              onChange={handleChange}
              min="0"
              step="0.5"
              placeholder="0.0"
            />
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>Template Tasks</h2>
            <button type="button" onClick={addTask} className="add-task-button">
              + Add Task
            </button>
          </div>

          <div className="tasks-list">
            {tasks.map((task, index) => (
              <div key={index} className="task-item">
                <div className="task-header">
                  <span className="task-number">Task {index + 1}</span>
                  {tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTask(index)}
                      className="remove-task-button"
                    >
                      🗑️ Remove
                    </button>
                  )}
                </div>

                <div className="task-fields">
                  <div className="form-group">
                    <label>Task Title *</label>
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => handleTaskChange(index, 'title', e.target.value)}
                      required
                      placeholder="e.g., Design Homepage Mockup"
                    />
                  </div>

                  <div className="form-group">
                    <label>Task Description</label>
                    <textarea
                      value={task.description}
                      onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                      rows={2}
                      placeholder="Additional task details..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Estimated Hours</label>
                    <input
                      type="number"
                      value={task.estimated_hours}
                      onChange={(e) => handleTaskChange(index, 'estimated_hours', e.target.value)}
                      min="0"
                      step="0.5"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/project-templates')} className="cancel-button">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="save-button">
            {saving ? 'Saving...' : (id ? 'Update Template' : 'Create Template')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProjectTemplateForm;
