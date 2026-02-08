import { useEffect, useRef } from 'react';

export type ModalType = 'confirm' | 'prompt' | 'alert';

interface ModalProps {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value?: string) => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary' | 'warning';
}

export default function Modal({
  isOpen,
  type,
  title,
  message = '',
  defaultValue = '',
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'primary',
}: ModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && type === 'prompt' && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen, type]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isOpen && type === 'alert') {
        onConfirm();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleEnter);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleEnter);
    };
  }, [isOpen, onCancel, onConfirm, type]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'prompt') {
      const value = inputRef.current?.value || '';
      onConfirm(value);
    } else {
      onConfirm();
    }
  };

  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
    primary: 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500',
    warning: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-modal-in">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {message && (
              <p className="text-sm text-gray-600 mb-4">{message}</p>
            )}

            {type === 'prompt' && (
              <input
                ref={inputRef}
                type="text"
                defaultValue={defaultValue}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                placeholder="Enter value..."
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex items-center justify-end gap-3">
            {type !== 'alert' && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
              >
                {cancelText}
              </button>
            )}
            <button
              type="submit"
              className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${variantStyles[variant]}`}
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
