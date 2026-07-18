import { MousePointer2, ChevronLeft } from 'lucide-react';
import type { WorkspaceNodeType, WorkspaceTheme } from './types';

interface EditorToolRailProps {
  nodeTypes: WorkspaceNodeType[];
  addNodeFromPalette: (type: WorkspaceNodeType['type']) => void;
  workspaceTheme: WorkspaceTheme;
  onClose: () => void;
}

export function EditorToolRail({
  nodeTypes,
  addNodeFromPalette,
  workspaceTheme,
  onClose
}: EditorToolRailProps) {
  const isDark = workspaceTheme === 'dark';
  const compactLabels: Record<WorkspaceNodeType['type'], string> = {
    start: 'Start',
    process: 'Step',
    decision: 'Branch',
    connector: 'Link',
    input: 'Input',
    manualInput: 'Manual',
    manualOperation: 'Action',
    triangle: 'Marker',
    hexagon: 'Prep',
    database: 'Data',
    annotation: 'Note',
    end: 'End'
  };

  return (
    <aside
      aria-label="Diagram tools"
      className={`hidden h-full w-[88px] shrink-0 border-r lg:flex lg:flex-col ${
        isDark ? 'border-white/8 bg-[#151517]' : 'border-slate-200/80 bg-[#f4efe6]'
      }`}
    >
      <div className="flex h-full flex-col px-3 py-4">
        <div className="mb-4 flex flex-col items-center gap-3">
          <button 
            onClick={onClose}
            aria-label="Hide diagram tools"
            className={`p-2 rounded-full mb-2 transition ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/5 text-slate-500'}`}
            title="Hide tools"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border shadow-lg ${
              isDark
                ? 'border-white/10 bg-white/[0.04] text-slate-100 shadow-black/20'
                : 'border-slate-200 bg-white/90 text-slate-700 shadow-[0_18px_40px_-28px_rgba(148,163,184,0.5)]'
            }`}
          >
            <MousePointer2 className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-600">Select</span>
        </div>

        <div className="flex w-full flex-col gap-2">
          {nodeTypes.map(({ type, icon: Icon, label, iconColor, surfaceClass }) => (
            <button
              key={type}
              onClick={() => addNodeFromPalette(type)}
              aria-label={`Add ${label} node`}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-800 transition hover:-translate-y-0.5 ${surfaceClass}`}
              title={`Add ${label}`}
            >
              <Icon className={`h-5 w-5 ${iconColor}`} />
              {compactLabels[type]}
            </button>
          ))}
        </div>

      </div>
    </aside>
  );
}
