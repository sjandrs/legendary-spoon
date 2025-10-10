import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import './ProjectTemplateList.css';

function ProjectTemplateList() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/project-templates/');
      setTemplates(response.data.results || response.data);
    } catch (_err) {
      setError('Failed to load project templates');
      console.error(_err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await api.delete(`/api/project-templates/${id}/`);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (_err) {
      alert('Failed to delete template');
      console.error(_err);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="project-template-list">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading project templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-template-list">
      <div className="list-header">
        <h1>📋 Project Templates</h1>
        <Link to="/project-templates/new" className="create-button">
          + Create Template
        </Link>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {filteredTemplates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Templates Found</h3>
          <p>Create reusable project templates to streamline your workflow</p>
          <Link to="/project-templates/new" className="create-button">
            Create Your First Template
          </Link>
        </div>
      ) : (
        <div className="templates-grid">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="template-card">
              <div className="card-header">
                <h3>{template.name}</h3>
                <div className="card-actions">
                  <Link to={`/project-templates/${template.id}/edit`} className="edit-btn">
                    ✏️
                  </Link>
                  <button onClick={() => handleDelete(template.id)} className="delete-btn">
                    🗑️
                  </button>
                </div>
              </div>
              <p className="description">{template.description || 'No description'}</p>
              <div className="card-footer">
                <span className="task-count">
                  {template.task_count || 0} tasks
                </span>
                <span className="created-date">
                  Created: {new Date(template.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectTemplateList;
