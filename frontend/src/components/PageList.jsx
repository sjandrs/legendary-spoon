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
  const data = response?.data ?? [];
  // Support both array and paginated shapes used in tests
  setPages(Array.isArray(data) ? data : (data.results || []));
    } catch (_err) {
      console.error('Error fetching pages:', _err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      try {
        await api.delete(`/api/pages/${id}/`);
        setPages(pages.filter(page => page.id !== id));
      } catch (_err) {
        console.error('Error deleting page:', _err);
        alert('Failed to delete page. Please try again.');
      }
    }
  };

  const filteredPages = (Array.isArray(pages) ? pages : []).filter(page => {
    const title = (page.title || '').toString();
    const slug = (page.slug || '').toString();
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         slug.toLowerCase().includes(searchTerm.toLowerCase());
    const status = page.status || (page.is_published ? 'published' : 'draft');
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
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
        <button className="btn-primary" onClick={() => navigate('/pages/new')} data-testid="new-page-button">
          + Create Page
        </button>
      </div>

      <div className="controls">
        <input
          type="text"
          placeholder="Search pages"
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
          <option value="draft">Not Live Only</option>
          <option value="published">Live Only</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {filteredPages.length === 0 ? (
        <div className="empty-state">
          <p>No pages found</p>
        </div>
      ) : (
        <table className="pages-table striped-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Template</th>
              <th>Publish Date</th>
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
                  <span className={`status-badge status-${page.is_published ? 'published' : (page.status || 'draft')}`}>
                    {page.is_published ? 'Published' : (page.status ? page.status : 'draft')}
                  </span>
                </td>
                <td>{page.template || 'Default'}</td>
                <td>
                  {page.published_at ? new Date(page.published_at).toLocaleDateString() : 'Not Live'}
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
                      data-testid={`edit-page-${page.id}`}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(page.id)}
                      title="Delete Page"
                      data-testid={`delete-page-${page.id}`}
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
