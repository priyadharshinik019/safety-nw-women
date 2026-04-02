import React, { useState, useCallback } from 'react';

let addToastFn = null;

export const toast = {
  error:   (msg) => addToastFn?.('error',   msg),
  success: (msg) => addToastFn?.('success', msg),
  info:    (msg) => addToastFn?.('info',    msg),
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  addToastFn = useCallback((type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(({ id, type, message }) => (
        <div key={id} className={`toast toast-${type}`}>
          {type === 'error' && '❌ '}
          {type === 'success' && '✅ '}
          {type === 'info' && 'ℹ️ '}
          {message}
        </div>
      ))}
    </div>
  );
}
