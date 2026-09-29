import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut } from 'lucide-react';

export function LogoutConfirmModal({ isOpen, onConfirm, onCancel }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <LogOut size={22} className="text-red-700" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-bold text-gray-900 mb-1">Logout</h3>
          <p className="text-sm text-gray-500">Are you sure you want to logout?</p>
        </div>
        <div className="flex gap-3 w-full mt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-800 text-sm font-bold text-white hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default LogoutConfirmModal;
