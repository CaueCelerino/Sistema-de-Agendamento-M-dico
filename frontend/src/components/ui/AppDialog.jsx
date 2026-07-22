import React from 'react';
import Button from './Button';

function AppDialog({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'primary',
}) {
  if (!isOpen) return null;

  return (
    <div className="app-dialog-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="app-dialog-card" onClick={(event) => event.stopPropagation()}>
        <div className="app-dialog-header">
          <h3>{title}</h3>
          <button className="app-dialog-close" type="button" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        <p className="app-dialog-message">{message}</p>
        <div className="app-dialog-actions">
          {onClose && (
            <Button variant="secondary" onClick={onClose}>
              {cancelLabel}
            </Button>
          )}
          {onConfirm && (
            <Button variant={confirmVariant} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppDialog;
