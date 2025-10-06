import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './PageList.css';

function PageList() {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/pages/');
      setPages(response.data);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      try {
        await api.delete(`/api/pages/${id}/`);
        setPages(pages.filter(page => page.id !== id));
      } catch (error) {
        console.error('Error deleting page:', error);
        alert('Failed to delete page. Please try again.');
      }
    }
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="page-list">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-list">
      <div className="header">
        <h1>CMS Pages</h1>
        <button className="btn-primary" onClick={() => navigate('/pages/new')}>
          + Create Page
        </button>
      </div>

      <div className="controls">
        <input
          type="text"
          placeholder="Search pages by title or slug..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {filteredPages.length === 0 ? (
        <div className="empty-state">
          <p>No pages found. Create your first page to get started!</p>
        </div>
      ) : (
        <table className="pages-table striped-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Template</th>
              <th>Published</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPages.map(page => (
              <tr key={page.id}>
                <td>
                  <strong>{page.title}</strong>
                </td>
                <td>
                  <code className="slug-code">/{page.slug}</code>
                </td>
                <td>
                  <span className={`status-badge status-${page.status}`}>
                    {page.status}
                  </span>
                </td>
                <td>{page.template || 'Default'}</td>
                <td>
                  {page.published_at ? new Date(page.published_at).toLocaleDateString() : 'Not published'}
                </td>
                <td>{new Date(page.updated_at).toLocaleDateString()}</td>
                <td>
                  <div className="actions">
                    <button
                      className="btn-view"
                      onClick={() => window.open(`/pages/${page.slug}`, '_blank')}
                      title="View Page"
                    >
                      View
                    </button>
                    <button
                      className="btn-edit"
                      onClick={() => navigate(`/pages/${page.id}/edit`)}
                      title="Edit Page"
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(page.id)}
                      title="Delete Page"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default PageList;
