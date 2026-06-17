import * as React from 'react';
import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  inputLabel?: string;
  inputPlaceholder?: string;
  onConfirm: (input?: string) => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'default', inputLabel, inputPlaceholder, onConfirm, onCancel,
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setInputValue('');
      setTimeout(() => {
        if (inputLabel) inputRef.current?.focus();
        else confirmRef.current?.focus();
      }, 50);
    }
  }, [open, inputLabel]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter' && !inputLabel) onConfirm();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, inputLabel, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-bold text-slate-800">{title}</h2>
        <p className="text-sm text-slate-600">{message}</p>

        {inputLabel && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{inputLabel}</label>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-500"
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={() => onConfirm(inputLabel ? inputValue : undefined)}
            className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-brand-green-600 hover:bg-brand-green-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
