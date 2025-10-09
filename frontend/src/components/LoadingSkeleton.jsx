import React from 'react';
import './LoadingSkeleton.css';

/**
 * LoadingSkeleton Component - TASK-083
 * Provides skeleton screens for better perceived performance during loading states
 *
 * @param {string} variant - Type of skeleton: 'text', 'title', 'avatar', 'rectangle', 'table', 'card', 'list'
 * @param {number} count - Number of skeleton elements to render (default: 1)
 * @param {string} width - Custom width (default: 100%)
 * @param {string} height - Custom height (default: varies by variant)
 * @param {string} className - Additional CSS classes
 */
const LoadingSkeleton = ({
  variant = 'text',
  count = 1,
  width,
  height,
  className = ''
}) => {
  const getSkeletonClass = () => {
    const baseClass = 'skeleton';
    const variantClass = `skeleton-${variant}`;
    return `${baseClass} ${variantClass} ${className}`.trim();
  };

  const getStyle = () => {
    const style = {};
    if (width) style.width = width;
    if (height) style.height = height;
    return style;
  };

  // Render table skeleton
  if (variant === 'table') {
    return (
      <div className="skeleton-table">
        <div className="skeleton-table-header">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-text" />
          ))}
        </div>
        {Array.from({ length: count || 5 }).map((_, i) => (
          <div key={i} className="skeleton-table-row">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="skeleton skeleton-text" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Render card skeleton
  if (variant === 'card') {
    return (
      <div className="skeleton-card">
        <div className="skeleton skeleton-rectangle" style={{ height: '200px' }} />
        <div className="skeleton-card-content">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" />
        </div>
      </div>
    );
  }

  // Render list skeleton
  if (variant === 'list') {
    return (
      <div className="skeleton-list">
        {Array.from({ length: count || 3 }).map((_, i) => (
          <div key={i} className="skeleton-list-item">
            <div className="skeleton skeleton-avatar" />
            <div className="skeleton-list-content">
              <div className="skeleton skeleton-title" style={{ width: '60%' }} />
              <div className="skeleton skeleton-text" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render standard skeleton elements
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={getSkeletonClass()} style={getStyle()} />
      ))}
    </>
  );
};

export default LoadingSkeleton;
