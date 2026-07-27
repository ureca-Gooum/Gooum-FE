import { X, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [render, setRender] = useState(isOpen);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      requestAnimationFrame(() => {
        setVisible(true);
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!render) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onCancel}
    >
      <div
        className={`relative w-[400px] overflow-hidden rounded-[1.5rem] bg-bg-default shadow-2xl transition-all duration-300 ${
          visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-4 top-4">
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-subtle text-fg-tertiary transition-colors hover:bg-bg-muted hover:text-fg-primary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 pt-8">
          <div className="flex flex-col items-center mb-6">
            <div
              className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                isDestructive ? 'bg-error/10 text-error' : 'bg-brand-soft text-brand-primary'
              }`}
            >
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-xl font-bold text-fg-primary mb-2 text-center">{title}</h2>
            <p className="text-[15px] text-fg-secondary text-center leading-relaxed whitespace-pre-wrap">{message}</p>
          </div>

          <div className="flex w-full gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl bg-bg-canvas py-3.5 text-[15px] font-semibold text-fg-secondary transition-all hover:bg-bg-subtle hover:text-fg-primary active:scale-95 border border-border-default"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className={`flex-1 rounded-xl py-3.5 text-[15px] font-semibold text-white shadow-lg transition-all active:scale-95 ${
                isDestructive
                  ? 'bg-error hover:bg-error/90 shadow-error/30'
                  : 'bg-brand-primary hover:bg-brand-primary/90 shadow-brand-primary/30'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
