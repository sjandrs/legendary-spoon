import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import './PageForm.css';

function PageForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'draft',
    template: 'default',
    meta_title: '',
    meta_description: '',
    featured_image: '',
    published_at: '',
    is_homepage: false,
    parent_page: ''
  });
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState([]);

  useEffect(() => {
    fetchPages();
    if (isEdit) {
      fetchPage();
    }
  }, [id]);

  const fetchPages = async () => {
    try {
      const response = await api.get('/api/pages/');
      setPages(response.data);
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  const fetchPage = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/pages/${id}/`);
      setFormData({
        ...response.data,
        published_at: response.data.published_at ? response.data.published_at.split('T')[0] : '',
        parent_page: response.data.parent_page?.id || ''
      });
    } catch (error) {
      console.error('Error fetching page:', error);
      alert('Failed to load page. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-generate slug from title if creating new page
    if (name === 'title' && !isEdit && !formData.slug) {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        parent_page: formData.parent_page || null,
        published_at: formData.published_at || null
      };

      if (isEdit) {
        await api.put(`/api/pages/${id}/`, payload);
        alert('Page updated successfully!');
      } else {
        await api.post('/api/pages/', payload);
        alert('Page created successfully!');
      }
      navigate('/pages');
    } catch (error) {
      console.error('Error saving page:', error);
      alert(`Failed to ${isEdit ? 'update' : 'create'} page. Please check all fields and try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="page-form">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-form">
      <div className="form-header">
        <h1>{isEdit ? 'Edit Page' : 'Create New Page'}</h1>
        <button className="btn-back" onClick={() => navigate('/pages')}>
          ← Back to Pages
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-section">
          <h2>Basic Information</h2>

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter page title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="slug">Slug *</label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              placeholder="page-url-slug"
            />
            <small className="help-text">URL-friendly version of the title. Will be auto-generated if left blank.</small>
          </div>

          <div className="form-group">
            <label htmlFor="excerpt">Excerpt</label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows="3"
              placeholder="Short description or summary"
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Content (Markdown supported) *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="15"
              required
              placeholder="Write your page content here..."
            />
            <small className="help-text">You can use Markdown formatting for rich text.</small>
          </div>
        </div>

        <div className="form-section">
          <h2>Page Settings</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="template">Template</label>
              <select
                id="template"
                name="template"
                value={formData.template}
                onChange={handleChange}
              >
                <option value="default">Default</option>
                <option value="full-width">Full Width</option>
                <option value="sidebar">Sidebar</option>
                <option value="landing">Landing Page</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="published_at">Publish Date</label>
              <input
                type="date"
                id="published_at"
                name="published_at"
                value={formData.published_at}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="parent_page">Parent Page</label>
              <select
                id="parent_page"
                name="parent_page"
                value={formData.parent_page}
                onChange={handleChange}
              >
                <option value="">None (Top Level)</option>
                {pages.filter(p => p.id !== parseInt(id)).map(page => (
                  <option key={page.id} value={page.id}>
                    {page.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="is_homepage"
                checked={formData.is_homepage}
                onChange={handleChange}
              />
              <span>Set as Homepage</span>
            </label>
            <small className="help-text">This page will be displayed at the root URL.</small>
          </div>
        </div>

        <div className="form-section">
          <h2>SEO & Media</h2>

          <div className="form-group">
            <label htmlFor="meta_title">Meta Title</label>
            <input
              type="text"
              id="meta_title"
              name="meta_title"
              value={formData.meta_title}
              onChange={handleChange}
              placeholder="SEO title (defaults to page title)"
            />
            <small className="help-text">Recommended: 50-60 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="meta_description">Meta Description</label>
            <textarea
              id="meta_description"
              name="meta_description"
              value={formData.meta_description}
              onChange={handleChange}
              rows="3"
              placeholder="SEO description for search engines"
            />
            <small className="help-text">Recommended: 150-160 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="featured_image">Featured Image URL</label>
            <input
              type="url"
              id="featured_image"
              name="featured_image"
              value={formData.featured_image}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? 'Saving...' : (isEdit ? 'Update Page' : 'Create Page')}
          </button>
          <button type="button" className="btn-cancel" onClick={() => navigate('/pages')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default PageForm;
