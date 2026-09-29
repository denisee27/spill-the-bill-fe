import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, Save } from 'lucide-react';

const VARIANTS = {
  danger:  { icon: Trash2,         iconBg: 'bg-red-50',    iconColor: 'text-red-600',    btn: 'bg-red-700 hover:bg-red-600'    },
  warning: { icon: AlertTriangle,  iconBg: 'bg-amber-50',  iconColor: 'text-amber-600',  btn: 'bg-amber-600 hover:bg-amber-500' },
  primary: { icon: Save,           iconBg: 'bg-brand-50',  iconColor: 'text-brand-700',  btn: 'bg-brand-800 hover:bg-brand-700' },
};

export function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Konfirmasi',
  message = 'Apakah kamu yakin ingin melanjutkan?',
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'primary',
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const { icon: Icon, iconBg, iconColor, btn } = VARIANTS[variant] ?? VARIANTS.primary;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-4 animate-fade-up">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}>
          <Icon size={22} className={iconColor} />
        </div>
        <div className="text-center">
          <h3 className="text-base font-bold text-dark-900 mb-1">{title}</h3>
          <p className="text-sm text-dark-500">{message}</p>
        </div>
        <div className="flex gap-3 w-full mt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-dark-200 text-sm font-medium text-dark-700 hover:bg-dark-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmModal;
