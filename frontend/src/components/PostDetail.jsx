import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`/api/posts/${id}/`)
      .then(response => {
        setPost(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("There was an error fetching the post!", error);
        setError('Failed to load post. It may not exist or the server is down.');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!post) return <div>Post not found.</div>;

  return (
    <div>
      <h1>{post.title}</h1>
      <p>By {post.author} on {new Date(post.created_at).toLocaleDateString()}</p>
      <hr />
      <div dangerouslySetInnerHTML={{ __html: post.rich_content }} />
      <hr />
      <Link to="/posts" className="button">Back to Posts</Link>
    </div>
  );
}

export default PostDetail;
