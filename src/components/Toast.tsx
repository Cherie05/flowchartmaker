import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  tone?: ToastTone;
  onDismiss: () => void;
}

export function Toast({ message, tone = 'info', onDismiss }: ToastProps) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'error' ? AlertCircle : Info;
  const toneClass = tone === 'success' ? 'border-emerald-200 text-emerald-800' : tone === 'error' ? 'border-rose-200 text-rose-800' : 'border-violet-200 text-violet-800';

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={`fixed bottom-5 left-1/2 z-[10000] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-sm font-medium shadow-xl ${toneClass}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss notification" className="ml-1 rounded-lg p-1 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
