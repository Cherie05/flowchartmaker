import { useEffect, useMemo, useRef } from 'react';
import { Search, X } from 'lucide-react';
import type { WorkspaceTheme } from './types';

export interface CommandMenuItem {
  id: string;
  title: string;
  description: string;
  shortcut?: string;
}

interface CommandMenuProps {
  isOpen: boolean;
  query: string;
  workspaceTheme: WorkspaceTheme;
  items: CommandMenuItem[];
  onQueryChange: (value: string) => void;
  onSelect: (item: CommandMenuItem) => void;
  onClose: () => void;
}

export function CommandMenu({
  isOpen,
  query,
  workspaceTheme,
  items,
  onQueryChange,
  onSelect,
  onClose
}: CommandMenuProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = workspaceTheme === 'dark';

  useEffect(() => {
    if (isOpen) {
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return items;
    }

    return items.filter((item) => {
      const haystack = `${item.title} ${item.description} ${item.shortcut ?? ''}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [items, query]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-[70] flex items-start justify-center bg-black/20 px-4 py-16 backdrop-blur-[2px]">
      <div
        className={`w-full max-w-xl rounded-[28px] border shadow-2xl backdrop-blur-xl ${
          isDark
            ? 'border-white/10 bg-[#17191d]/96 shadow-black/50'
            : 'border-white/90 bg-white/96 shadow-[0_34px_90px_-54px_rgba(15,23,42,0.45)]'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <Search className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filteredItems[0]) {
                e.preventDefault();
                onSelect(filteredItems[0]);
              }

              if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
            placeholder="Search tools, shapes, actions..."
            className={`w-full bg-transparent text-sm outline-none ${
              isDark ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
            }`}
          />
          <button
            onClick={onClose}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border transition ${
              isDark
                ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.08]'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
            title="Close command menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-3">
          {filteredItems.length ? (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className={`flex w-full items-start justify-between gap-4 rounded-[20px] border px-4 py-3 text-left transition ${
                    isDark
                      ? 'border-white/10 bg-white/[0.03] hover:border-sky-400/30 hover:bg-sky-500/10'
                      : 'border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{item.title}</p>
                    <p className={`mt-1 text-xs leading-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.description}</p>
                  </div>
                  {item.shortcut ? (
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                        isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.shortcut}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <div
              className={`rounded-[20px] border border-dashed px-4 py-8 text-center text-sm ${
                isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'
              }`}
            >
              No commands match that search yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
