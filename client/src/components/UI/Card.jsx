import React from 'react';

const Card = ({
  children,
  pastel,
  interactive = false,
  className = '',
  style = {},
  onClick,
  ...props
}) => {
  const pastelClass = pastel ? `card-pastel-${pastel}` : '';
  const interactiveClass = interactive ? 'card-interactive' : '';

  return (
    <div
      className={`card ${pastelClass} ${interactiveClass} ${className}`.trim()}
      style={style}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
