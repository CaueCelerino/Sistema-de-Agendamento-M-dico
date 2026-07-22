import React from 'react';

function Card({ title, children }) {
  const headingId = title ? `card-${title.replace(/\s+/g, '-').toLowerCase()}-title` : undefined;
  return (
    <section className="small-card" role="region" aria-labelledby={headingId} tabIndex={0}>
      {title && <h3 id={headingId}>{title}</h3>}
      {children}
    </section>
  );
}

export default Card;
