import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, AlertTriangle } from 'lucide-react';
import { subscribeAlert, type AlertOptions } from '@/utils/alert';

export function AlertModal() {
  const [options, setOptions] = useState<AlertOptions | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return subscribeAlert((opts) => {
      setOptions(opts);
      requestAnimationFrame(() => setVisible(true));
    });
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => setOptions(null), 200);
  };

  if (!options) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}>
      <div
        className={`w-[340px] rounded-2xl bg-bg-default p-5 shadow-xl transition-all duration-200 ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              options.isDestructive ? 'bg-error/10 text-error' : 'bg-brand-soft text-brand-primary'
            }`}>
            {options.isDestructive ? <AlertTriangle size={18} /> : <Info size={18} />}
          </div>
          <div className="flex-1 pt-1">
            {options.title && <p className="mb-1 text-[15px] font-semibold text-fg-primary">{options.title}</p>}
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-fg-secondary">{options.message}</p>
          </div>
        </div>

        <button
          onClick={handleClose}
          autoFocus
          className="mt-4 w-full rounded-lg bg-brand-primary py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-primary/90 active:scale-[0.98]">
          확인
        </button>
      </div>
    </div>,
    document.body,
  );
}
