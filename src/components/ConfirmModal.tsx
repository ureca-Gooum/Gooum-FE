import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onCancel}>
          <motion.div
            className="relative w-[340px] rounded-lg bg-bg-default p-6 pt-7 shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onCancel}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-fg-tertiary transition-colors hover:bg-bg-subtle hover:text-fg-primary">
              <X size={16} />
            </button>

            <h2 className="mb-2 text-lg font-bold text-fg-primary">{title}</h2>
            <p className="mb-6 text-[13px] leading-relaxed whitespace-pre-wrap text-fg-secondary">{message}</p>

            <div className="flex w-full gap-2">
              <button
                onClick={onCancel}
                className="flex-1 rounded-lg border border-border-default bg-bg-canvas py-2 text-[13px] font-semibold text-fg-secondary transition-all hover:bg-bg-subtle hover:text-fg-primary active:scale-95">
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onCancel();
                }}
                className={`flex-1 rounded-lg py-2 text-[13px] font-semibold text-white shadow-sm transition-all active:scale-95 ${
                  isDestructive ? 'bg-error hover:bg-error/90' : 'bg-brand-primary hover:bg-brand-primary/90'
                }`}>
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
