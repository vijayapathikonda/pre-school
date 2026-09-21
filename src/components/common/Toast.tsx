import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type?: ToastType;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const type = toast.type || 'success';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md pointer-events-auto transition-all duration-300 ease-out">
      <div
        className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center justify-between gap-3 ${
          type === 'success'
            ? 'bg-slate-900 border-emerald-500/80 text-white ring-2 ring-emerald-500/20'
            : type === 'error'
            ? 'bg-slate-900 border-rose-500/80 text-white ring-2 ring-rose-500/20'
            : type === 'warning'
            ? 'bg-slate-900 border-amber-500/80 text-amber-100 ring-2 ring-amber-500/20'
            : 'bg-slate-900 border-indigo-500/80 text-white ring-2 ring-indigo-500/20'
        }`}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="shrink-0">
            {type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {type === 'info' && <Info className="w-5 h-5 text-indigo-400" />}
          </div>
          <div className="min-w-0">
            {toast.title && (
              <h4 className="text-xs font-extrabold tracking-tight text-white mb-0.5">{toast.title}</h4>
            )}
            <p className="text-xs font-semibold leading-snug break-words text-slate-100">
              {toast.message}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white shrink-0 transition-colors"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
