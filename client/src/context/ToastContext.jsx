import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const TOAST_TYPES = {
  success: {
    bg: 'bg-white/90 border-l-4 border-l-emerald-500 text-gray-800',
    icon: '🎉',
    iconBg: 'bg-emerald-50 text-emerald-600',
  },
  error: {
    bg: 'bg-white/90 border-l-4 border-l-red-500 text-gray-800',
    icon: '⚠️',
    iconBg: 'bg-red-50 text-red-600',
  },
  warning: {
    bg: 'bg-white/90 border-l-4 border-l-amber-500 text-gray-800',
    icon: '🔔',
    iconBg: 'bg-amber-50 text-amber-600',
  },
  info: {
    bg: 'bg-white/90 border-l-4 border-l-blue-500 text-gray-800',
    icon: 'ℹ️',
    iconBg: 'bg-blue-50 text-blue-600',
  },
  confirm: {
    bg: 'bg-white/90 border-l-4 border-l-amber-500 text-gray-800',
    icon: '🔔',
    iconBg: 'bg-amber-50 text-amber-600',
  },
};



export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const addConfirm = useCallback((message, confirmLabel = 'Confirm') => {
  return new Promise((resolve) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, {
      id,
      message,
      type: 'confirm',
      confirmLabel,
      onConfirm: () => { setToasts(p => p.filter(t => t.id !== id)); resolve(true); },
      onCancel:  () => { setToasts(p => p.filter(t => t.id !== id)); resolve(false); },
    }]);
  });
}, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    confirm: (msg, confirmLabel) => addConfirm(msg, confirmLabel),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Portal/Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const typeMeta = TOAST_TYPES[t.type] || TOAST_TYPES.success;
          return (
            <div
  key={t.id}
  className={`toast-enter flex flex-col p-4 rounded-2xl shadow-xl backdrop-blur-md border border-gray-100 w-full pointer-events-auto ${typeMeta.bg}`}
  style={{ transition: 'all 0.25s ease-in-out' }}
>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 ${typeMeta.iconBg}`}>
        {typeMeta.icon}
      </div>
      <p className="text-xs font-semibold">{t.message}</p>
    </div>
    {t.type !== 'confirm' && (
      <button
        onClick={() => removeToast(t.id)}
        className="text-gray-400 hover:text-gray-600 text-sm font-bold pl-3 flex-shrink-0"
      >
        ✕
      </button>
    )}
  </div>

  {t.type === 'confirm' && (
    <div className="flex gap-2 mt-3 pl-11">
      <button
        onClick={t.onCancel}
        className="flex-1 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={t.onConfirm}
        className="flex-1 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
      >
        {t.confirmLabel || 'Confirm'}
      </button>
    </div>
  )}
</div>
          )
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx.toast;
};
