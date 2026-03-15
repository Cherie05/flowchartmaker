import type { LucideIcon } from 'lucide-react';

export function WorkspaceChip({
  label,
  value,
  accent = false
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm font-medium ${
        accent
          ? 'border-orange-200 bg-orange-50 text-orange-900'
          : 'border-slate-200 bg-white/85 text-slate-700'
      }`}
    >
      <span className="text-[10px] uppercase tracking-[0.18em] opacity-65">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function CanvasPill({
  icon: Icon,
  label
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm shadow-slate-200/30 backdrop-blur">
      <Icon className="h-3.5 w-3.5 text-slate-500" />
      {label}
    </div>
  );
}

export function EmptyStateStep({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-[#fbfbf8] p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

export function SelectionMetric({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-[#fbfbf8] p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

export function ShortcutRow({
  action,
  result
}: {
  action: string;
  result: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[18px] border border-slate-200 bg-[#fbfbf8] px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="font-medium text-slate-900">{action}</span>
      <span className="max-w-[190px] text-slate-500 sm:text-right">{result}</span>
    </div>
  );
}
