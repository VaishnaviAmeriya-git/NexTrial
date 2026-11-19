import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-[4px] border border-border shadow-md max-w-md w-full p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${danger ? 'bg-red-100 text-status-danger' : 'bg-blue-100 text-secondary'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 id="modal-title" className="text-lg font-bold text-primary">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-text-muted hover:text-text-main p-1 rounded"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-text-muted leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            onClick={onCancel}
            className="h-10 px-4 rounded-[4px] border border-border bg-white text-text-main hover:bg-slate-50 font-medium text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`h-10 px-4 rounded-[4px] text-white font-medium text-sm ${
              danger
                ? 'bg-status-danger hover:bg-red-800'
                : 'bg-primary hover:bg-primary-hover'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
