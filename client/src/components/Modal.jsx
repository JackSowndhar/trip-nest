import React from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-3xl w-full ${sizeClasses[size] || 'max-w-md'} shadow-2xl border border-gray-100 overflow-hidden animate-scale-up`}>
        <div className="h-2 w-full bg-gradient-to-r from-primary-500 via-primary-600 to-emerald-400" />
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display font-bold text-xl text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
