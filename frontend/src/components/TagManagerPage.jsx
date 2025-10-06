import React from 'react';
import { useNavigate } from 'react-router-dom';
import TagManager from './TagManager';
import './TagManagerPage.css';

function TagManagerPage() {
  const navigate = useNavigate();

  return (
    <div className="tag-manager-page">
      <div className="page-header">
        <h1>🏷️ Tags Management</h1>
        <button onClick={() => navigate('/blog')} className="back-button">
          ← Back to Blog
        </button>
      </div>
      
      <div className="page-content">
        <div className="info-box">
          <p>Organize your content with tags. Tags help users discover related posts and improve SEO.</p>
        </div>
        <TagManager />
      </div>
    </div>
  );
}

export default TagManagerPage;
