import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import './BlogPostForm.css';

function BlogPostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft',
    published_at: '',
    tags: '',
    meta_description: '',
    featured_image_url: '',
  });

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/posts/${id}/`);
      const post = response.data;
      setFormData({
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        status: post.status || 'draft',
        published_at: post.published_at || '',
        tags: Array.isArray(post.tags)
          ? post.tags.map(t => typeof t === 'string' ? t : t.name).join(', ')
          : '',
        meta_description: post.meta_description || '',
        featured_image_url: post.featured_image_url || '',
      });
    } catch (err) {
      setError('Failed to load blog post');
      console.error(err);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      if (id) {
        await api.put(`/api/posts/${id}/`, payload);
      } else {
        await api.post('/api/posts/', payload);
      }

      navigate('/blog');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save blog post');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="blog-post-form">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading blog post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-post-form">
      <div className="form-header">
        <h1>{id ? '✏️ Edit Blog Post' : '➕ New Blog Post'}</h1>
        <button onClick={() => navigate('/blog')} className="back-button">
          ← Back to Posts
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="post-form">
        <div className="form-section">
          <h2>Post Content</h2>

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter post title..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="excerpt">Excerpt</label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows={3}
              placeholder="Brief summary of the post..."
            />
            <small className="help-text">Shown in post previews and search results</small>
          </div>

          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={15}
              required
              placeholder="Write your post content here..."
            />
            <small className="help-text">Supports Markdown formatting</small>
          </div>
        </div>

        <div className="form-section">
          <h2>Publishing Options</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="published_at">Publish Date</label>
              <input
                type="datetime-local"
                id="published_at"
                name="published_at"
                value={formData.published_at}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., marketing, sales, tips"
            />
            <small className="help-text">Separate multiple tags with commas</small>
          </div>
        </div>

        <div className="form-section">
          <h2>SEO & Media</h2>

          <div className="form-group">
            <label htmlFor="featured_image_url">Featured Image URL</label>
            <input
              type="url"
              id="featured_image_url"
              name="featured_image_url"
              value={formData.featured_image_url}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="form-group">
            <label htmlFor="meta_description">Meta Description</label>
            <textarea
              id="meta_description"
              name="meta_description"
              value={formData.meta_description}
              onChange={handleChange}
              rows={3}
              placeholder="SEO-friendly description for search engines..."
            />
            <small className="help-text">Recommended: 150-160 characters</small>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/blog')} className="cancel-button">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="save-button">
            {saving ? 'Saving...' : (id ? 'Update Post' : 'Create Post')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BlogPostForm;
