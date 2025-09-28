import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('/api/posts/');
        const postData = Array.isArray(response.data.results) ? response.data.results : [];
        setPosts(postData);
      } catch (error) {
        console.error("There was an error fetching the posts!", error);
        setError('Failed to load posts.');
        setPosts([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Latest Posts</h1>
      {posts && posts.length > 0 ? (
        <ul className="post-list">
          {posts.map(post => (
            <li key={post.id}>
              <h2><Link to={`/posts/${post.id}`}>{post.title}</Link></h2>
              <p>By {post.author_username || 'Unknown Author'} on {new Date(post.created_at).toLocaleDateString()}</p>
              <div dangerouslySetInnerHTML={{ __html: (post.rich_content || '').substring(0, 200) + '...' }} />
              <Link to={`/posts/${post.id}`}>Read more</Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No posts found.</p>
      )}
    </div>
  );
}

export default PostList;
