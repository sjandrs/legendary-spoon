import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../api';
import './KnowledgeBase.css';

const KnowledgeBase = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await get('/api/kb/');
        // Correctly access the .data property from the axios response
        const articleData = Array.isArray(response.data) ? response.data : [];
        setArticles(articleData);
        setError(null);
      } catch (err) {
        setError('Failed to load knowledge base articles.');
        console.error(err);
        setArticles([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  return (
    <div className="kb-container">
      <h1>Knowledge Base</h1>
      {loading && <p>Loading articles...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && (
        <ul className="article-list">
          {articles && articles.length > 0 ? (
            articles.map(article => (
              <li key={article} className="article-item">
                <Link to={`/kb/${article}`} className="article-link">
                  {article.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Link>
              </li>
            ))
          ) : (
            <p>No articles found.</p>
          )}
        </ul>
      )}
    </div>
  );
};

export default KnowledgeBase;
