import React from 'react';

const PageHeader = ({
  title,
  subtitle,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div className={`page-header ${className}`}>
      <div>
        {badge && <div style={{ marginBottom: '0.65rem' }}>{badge}</div>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
};

export default PageHeader;
