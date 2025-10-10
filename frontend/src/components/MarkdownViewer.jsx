import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { get } from '../api';
import './MarkdownViewer.css';

const MarkdownViewer = () => {
  const { fileName } = useParams();
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarkdown = async () => {
      try {
        setLoading(true);
        const response = await get(`/api/kb/${fileName}/`);
        setMarkdown(response.data.content);
        setError(null);
      } catch (_err) {
        setError('Failed to load the document. Please make sure the file exists and the server is running.');
        console.error(_err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkdown();
  }, [fileName]);

  return (
    <div className="markdown-viewer-container">
      {loading && <div className="loading-message">Loading document...</div>}
      {error && <div className="error-message">{error}</div>}
      {!loading && !error && (
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdown}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default MarkdownViewer;
