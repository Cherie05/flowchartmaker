import { useEffect, useId, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }: ConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => cancelButtonRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancelRef.current();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl sm:p-8">
        <button type="button" onClick={onCancel} aria-label="Close confirmation" className="absolute right-5 top-5 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100"><AlertTriangle className="h-6 w-6 text-rose-700" aria-hidden="true" /></div>
        <h2 id={titleId} className="mb-2 text-2xl font-bold tracking-tight text-slate-950">{title}</h2>
        <p id={descriptionId} className="mb-8 leading-7 text-slate-600">{message}</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={cancelButtonRef} type="button" onClick={onCancel} className="rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">{cancelText}</button>
          <button type="button" onClick={onConfirm} className="rounded-xl bg-rose-700 px-5 py-3 font-semibold text-white transition hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
