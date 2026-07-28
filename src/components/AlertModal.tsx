import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeAlert, type AlertOptions } from '@/utils/alert';

/**
 * 앱 전역에서 window.alert() 대신 쓰는 알림 모달.
 * 캐릭터 없이 텍스트 + 버튼 하나로 심플하게, ConfirmModal과 같은 톤으로 맞췄다.
 * main.tsx 루트에 한 번만 마운트해두면, 어디서든 showAlert()로 띄울 수 있다.
 */
export function AlertModal() {
  const [options, setOptions] = useState<AlertOptions | null>(null);

  useEffect(() => {
    return subscribeAlert((opts) => setOptions(opts));
  }, []);

  const handleClose = () => setOptions(null);

  return createPortal(
    <AnimatePresence>
      {options && (
        <motion.div
          className="absolute inset-0 z-[10000] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={handleClose}>
          <motion.div
            className="w-[320px] rounded-lg bg-bg-default p-6 pt-7 shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            onClick={(e) => e.stopPropagation()}>
            {options.title && <h2 className="mb-2 text-lg font-bold text-fg-primary">{options.title}</h2>}
            <p className="mb-6 text-[13px] leading-relaxed whitespace-pre-wrap text-fg-secondary">{options.message}</p>

            <button
              onClick={handleClose}
              autoFocus
              className={`w-full rounded-lg py-2 text-[13px] font-semibold text-white shadow-sm transition-all active:scale-95 ${
                options.isDestructive ? 'bg-error hover:bg-error/90' : 'bg-brand-primary hover:bg-brand-primary/90'
              }`}>
              확인
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.getElementById('modal-root') || document.body,
  );
}
