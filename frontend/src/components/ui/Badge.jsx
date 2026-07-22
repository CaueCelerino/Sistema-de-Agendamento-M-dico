import React from 'react';

function Badge({ text, variant = 'default', 'ariaLabel': ariaLabel }) {
  const normalizedVariant = variant === 'warning' ? 'warning' : variant;

  return (
    <span className={`badge badge-${normalizedVariant}`} role="status" aria-label={ariaLabel || text}>
      {text}
    </span>
  );
}

export default Badge;
