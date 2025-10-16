import React from 'react';

// Simple skip link component to jump to main content
// Usage: place as the first focusable element in the app shell
const SkipLink = () => (
  <a href="#main-content" className="skip-link">
    Skip to main content
  </a>
);

export default SkipLink;
