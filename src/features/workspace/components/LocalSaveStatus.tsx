import { AlertCircle, Check, Loader } from 'lucide-react';

export type LocalSaveState = 'idle' | 'saving' | 'saved' | 'error';

export function LocalSaveStatus({ status, dark = false }: { status: LocalSaveState; dark?: boolean }) {
  const label = status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved locally' : status === 'error' ? 'Unable to save' : 'Local autosave';
  const Icon = status === 'saving' ? Loader : status === 'saved' ? Check : status === 'error' ? AlertCircle : Check;
  const tone = status === 'error' ? 'text-rose-600' : status === 'saved' ? 'text-emerald-600' : dark ? 'text-slate-400' : 'text-slate-500';
  return (
    <span role="status" aria-live="polite" className={`inline-flex items-center gap-1.5 text-xs font-medium ${tone}`}>
      <Icon className={`h-3.5 w-3.5 ${status === 'saving' ? 'animate-spin' : ''}`} aria-hidden="true" />
      {label}
    </span>
  );
}
