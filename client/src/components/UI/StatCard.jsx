import React from 'react';

const PASTEL_BG_MAP = {
  sky: 'var(--pastel-sky-subtle)',
  lavender: 'var(--pastel-lavender-subtle)',
  pink: 'var(--pastel-pink-subtle)',
  mauve: 'var(--pastel-mauve-subtle)',
  periwinkle: 'var(--pastel-periwinkle-subtle)',
};

const PASTEL_COLOR_MAP = {
  sky: '#2A4375',
  lavender: '#4A3572',
  pink: '#7A2268',
  mauve: '#5E2B82',
  periwinkle: '#2D3875',
};

const StatCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  pastel = 'sky',
  badge,
  onClick,
  className = '',
}) => {
  const iconBg = PASTEL_BG_MAP[pastel] || PASTEL_BG_MAP.sky;
  const iconColor = PASTEL_COLOR_MAP[pastel] || PASTEL_COLOR_MAP.sky;
  const cardBorderClass = `card-pastel-${pastel}`;

  return (
    <div
      className={`stat-card ${cardBorderClass} ${onClick ? 'card-interactive' : ''} ${className}`}
      onClick={onClick}
    >
      {Icon && (
        <div
          className="stat-icon-wrapper"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          <Icon size={22} />
        </div>
      )}
      <div className="stat-info">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <span className="stat-label">{label}</span>
          {badge}
        </div>
        <div className="stat-value">{value}</div>
        {subtext && <div className="stat-subtext">{subtext}</div>}
      </div>
    </div>
  );
};

export default StatCard;
