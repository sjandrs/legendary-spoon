import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../api';
import './BlogPostList.css';

function BlogPostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    // When search term changes, fetch from server with ?search= to match backend behavior/tests
    const controller = new AbortController();
    const run = async () => {
      await fetchPosts({ search: searchTerm, signal: controller.signal });
    };
    run();
    return () => controller.abort();
  }, [searchTerm]);

  const fetchPosts = async ({ search, signal } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const url = params.toString() ? `/api/blog-posts/?${params.toString()}` : '/api/blog-posts/';
      const response = await get(url, { signal });
      const data = response?.data ?? [];
      setPosts(data.results || data || []);
      if (data && typeof data === 'object' && 'count' in data) {
        setPagination({ count: data.count || 0, next: data.next || null, previous: data.previous || null });
      } else {
        setPagination({ count: Array.isArray(data) ? data.length : 0, next: null, previous: null });
      }
    } catch (_err) {
      setError('Error loading blog posts');
      console.error(_err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/posts/${id}/`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setPosts(posts.filter(p => p.id !== id));
    } catch (_err) {
      alert('Failed to delete blog post');
      console.error(_err);
    }
  };

  const filteredPosts = posts
    .filter(post => {
      if (statusFilter === 'all') return true;
      return post.status === statusFilter;
    });

  if (loading) {
    return (
      <div className="blog-post-list">
        <div className="loading-state" data-testid="loading-skeleton">
          <div className="spinner"></div>
          <p>Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-post-list">
      <div className="list-header">
        <h1>📝 Blog Posts</h1>
        <Link
          to="/blog/new"
          className="create-button"
          data-testid="new-blog-post-button"
          aria-label="Create new blog post"
        >
          + New Post
        </Link>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search blog posts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
          data-testid="status-filter"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button type="button" onClick={fetchPosts} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {filteredPosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No Blog Posts Found</h3>
          <p>Create engaging content to share with your audience</p>
          <Link to="/blog/new" className="create-button">
            Create your first blog post
          </Link>
        </div>
      ) : (
        <div className="posts-table">
          <table role="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Published Date</th>
                <th>Tags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <Link to={`/blog/${post.id}`} className="post-title-link">
                      {post.title}
                    </Link>
                  </td>
                  <td>{typeof post.author === 'object' ? (post.author?.username || 'Unknown') : (post.author || 'Unknown')}</td>
                  <td>
                    <span className={`status-badge status-${post.status}`}>
                      {post.status || 'draft'}
                    </span>
                  </td>
                  <td>
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString()
                      : 'Not published'}
                  </td>
                  <td>
                    <div className="tags-cell">
                      {post.tags && post.tags.length > 0 ? (
                        post.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="tag-badge">
                            {tag.name || tag}
                          </span>
                        ))
                      ) : (
                        <span className="no-tags">No tags</span>
                      )}
                      {post.tags && post.tags.length > 3 && (
                        <span className="tag-badge more-tags">
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <Link to={`/blog/${post.id}`} className="action-btn view-btn" title="View">
                        👁️
                      </Link>
                      <Link
                        to={`/blog/${post.id}/edit`}
                        className="action-btn edit-btn"
                        title="Edit"
                        data-testid={`edit-blog-post-${post.id}`}
                      >
                        ✏️
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="action-btn delete-btn"
                        title="Delete"
                        data-testid={`delete-blog-post-${post.id}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(pagination.next || pagination.previous) && (
        <div className="pagination" data-testid="pagination">
          {pagination.previous && (
            <button type="button" className="prev-button">Prev</button>
          )}
          {pagination.next && (
            <button type="button" className="next-button">Next</button>
          )}
        </div>
      )}
    </div>
  );
}

export default BlogPostList;
