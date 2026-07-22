import React from 'react';

function Badge({ text, variant = 'default', 'ariaLabel': ariaLabel }) {
  return (
    <span className={`badge badge-${variant}`} role="status" aria-label={ariaLabel || text}>
      {text}
    </span>
  );
}

export default Badge;
