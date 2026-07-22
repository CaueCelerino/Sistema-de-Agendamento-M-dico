import React from 'react';

function Button({ children, variant = 'primary', type = 'button', disabled = false, ...rest }) {
  return (
    <button
      className={`button button-${variant}`}
      type={type}
      disabled={disabled}
      aria-disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
