import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import './BlogPostList.css';

function BlogPostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/posts/');
      setPosts(response.data.results || response.data);
    } catch (err) {
      setError('Failed to load blog posts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      await api.delete(`/api/posts/${id}/`);
      setPosts(posts.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete blog post');
      console.error(err);
    }
  };

  const filteredPosts = posts
    .filter(post =>
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(post => {
      if (statusFilter === 'all') return true;
      return post.status === statusFilter;
    });

  if (loading) {
    return (
      <div className="blog-post-list">
        <div className="loading-state">
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
        <Link to="/blog/new" className="create-button">
          + New Post
        </Link>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search posts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {filteredPosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No Blog Posts Found</h3>
          <p>Create engaging content to share with your audience</p>
          <Link to="/blog/new" className="create-button">
            Create Your First Post
          </Link>
        </div>
      ) : (
        <div className="posts-table">
          <table>
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
                  <td>{post.author || 'Unknown'}</td>
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
                      <Link to={`/blog/${post.id}/edit`} className="action-btn edit-btn" title="Edit">
                        ✏️
                      </Link>
                      <button 
                        onClick={() => handleDelete(post.id)} 
                        className="action-btn delete-btn"
                        title="Delete"
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
    </div>
  );
}

export default BlogPostList;
