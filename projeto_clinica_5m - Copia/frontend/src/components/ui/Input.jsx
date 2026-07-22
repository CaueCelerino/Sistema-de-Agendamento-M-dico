import React from 'react';

function Input({ label, id, ...props }) {
  return (
    <div className="input-group">
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      )}
      <input id={id} {...props} className="input-field" aria-required={props.required ? 'true' : 'false'} />
    </div>
  );
}

export default Input;
