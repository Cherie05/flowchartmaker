import type { LucideIcon } from 'lucide-react';
import type { WorkspaceTheme } from './types';

export function WorkspaceChip({
  label,
  value,
  accent = false,
  theme = 'dark'
}: {
  label: string;
  value: string;
  accent?: boolean;
  theme?: WorkspaceTheme;
}) {
  const isDark = theme === 'dark';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm font-medium ${
        accent
          ? isDark
            ? 'border-orange-500/30 bg-orange-500/10 text-orange-100'
            : 'border-orange-200 bg-orange-50 text-orange-700'
          : isDark
            ? 'border-white/10 bg-white/[0.04] text-slate-200'
            : 'border-slate-200 bg-white/90 text-slate-700'
      }`}
    >
      <span
        className={`text-[10px] uppercase tracking-[0.18em] ${
          isDark ? 'text-slate-400' : accent ? 'text-orange-500' : 'text-slate-500'
        }`}
      >
        {label}
      </span>
      <span>{value}</span>
    </div>
  );
}

export function CanvasPill({
  icon: Icon,
  label,
  theme = 'dark'
}: {
  icon: LucideIcon;
  label: string;
  theme?: WorkspaceTheme;
}) {
  const isDark = theme === 'dark';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium shadow-lg backdrop-blur ${
        isDark
          ? 'border-white/10 bg-[#1f2026]/92 text-slate-300 shadow-black/20'
          : 'border-white/80 bg-white/90 text-slate-700 shadow-[0_20px_45px_-28px_rgba(148,163,184,0.5)]'
      }`}
    >
      <Icon className={`h-3.5 w-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
      {label}
    </div>
  );
}

export function EmptyStateStep({
  title,
  description,
  theme = 'dark'
}: {
  title: string;
  description: string;
  theme?: WorkspaceTheme;
}) {
  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-[20px] border p-4 ${
        isDark ? 'border-white/10 bg-[#17181d]' : 'border-slate-200 bg-white/92'
      }`}
    >
      <p className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{title}</p>
      <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
    </div>
  );
}

export function SelectionMetric({
  label,
  value,
  theme = 'dark'
}: {
  label: string;
  value: string;
  theme?: WorkspaceTheme;
}) {
  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-[20px] border p-3 ${
        isDark ? 'border-white/10 bg-[#17181d]' : 'border-slate-200 bg-white/92'
      }`}
    >
      <div className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
        {label}
      </div>
      <div className={`mt-2 text-sm font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

export function ShortcutRow({
  action,
  result,
  theme = 'dark'
}: {
  action: string;
  result: string;
  theme?: WorkspaceTheme;
}) {
  const isDark = theme === 'dark';

  return (
    <div
      className={`flex flex-col gap-2 rounded-[18px] border px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 ${
        isDark ? 'border-white/10 bg-[#17181d]' : 'border-slate-200 bg-white/92'
      }`}
    >
      <span className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{action}</span>
      <span className={`max-w-[190px] sm:text-right ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{result}</span>
    </div>
  );
}
