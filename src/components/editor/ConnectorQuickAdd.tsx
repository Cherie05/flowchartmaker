import { Plus, X } from 'lucide-react';
import type { WorkspaceNodeType, WorkspaceTheme } from './types';

interface ConnectorQuickAddProps {
  isOpen: boolean;
  x: number;
  y: number;
  workspaceTheme: WorkspaceTheme;
  title: string;
  items: WorkspaceNodeType[];
  onSelect: (type: WorkspaceNodeType['type']) => void;
  onClose: () => void;
}

export function ConnectorQuickAdd({
  isOpen,
  x,
  y,
  workspaceTheme,
  title,
  items,
  onSelect,
  onClose
}: ConnectorQuickAddProps) {
  if (!isOpen) {
    return null;
  }

  const isDark = workspaceTheme === 'dark';

  return (
    <div
      className="absolute z-50"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -115%)'
      }}
    >
      <div
        className={`w-[320px] rounded-[24px] border p-3 shadow-2xl backdrop-blur-xl ${
          isDark
            ? 'border-white/10 bg-[#17191d]/96 shadow-black/40'
            : 'border-white/80 bg-white/96 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.45)]'
        }`}
      >
        <div className="mb-3 flex items-start justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Quick Add</p>
            <p className={`mt-1 text-sm font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{title}</p>
          </div>
          <button
            onClick={onClose}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border transition ${
              isDark
                ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.08]'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
            title="Close quick add"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {items.map(({ type, icon: Icon, label, description, iconColor, surfaceClass }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={`flex items-start gap-3 rounded-[20px] border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${surfaceClass}`}
            >
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black/10">
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-950">{label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-700">{description}</p>
              </div>
            </button>
          ))}
        </div>

        <div
          className={`mt-3 flex items-center gap-2 rounded-2xl px-3 py-2 text-xs ${
            isDark ? 'bg-white/[0.04] text-slate-400' : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          Pick a block to create the next connected step.
        </div>
      </div>
    </div>
  );
}
