import { Bot, FileJson, MousePointer2, Upload } from 'lucide-react';
import type { WorkspaceNodeType } from './types';

interface EditorToolRailProps {
  nodeTypes: WorkspaceNodeType[];
  addNodeFromPalette: (type: WorkspaceNodeType['type']) => void;
  onFocusAI: () => void;
  onImport: () => void;
  onExportJson: () => void;
}

export function EditorToolRail({
  nodeTypes,
  addNodeFromPalette,
  onFocusAI,
  onImport,
  onExportJson
}: EditorToolRailProps) {
  const compactLabels: Record<WorkspaceNodeType['type'], string> = {
    start: 'Start',
    process: 'Step',
    decision: 'Branch',
    connector: 'Link',
    end: 'End'
  };

  return (
    <aside className="sticky top-5 hidden w-[76px] shrink-0 xl:flex xl:flex-col xl:gap-3">
      <div className="rounded-[28px] border border-white/80 bg-white/82 px-2 py-3 shadow-[0_22px_80px_-52px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div className="mb-3 flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15">
            <MousePointer2 className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Quick</span>
        </div>

        <div className="flex w-full flex-col gap-2">
          <button
            onClick={onFocusAI}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-orange-200 bg-orange-50 px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-orange-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-100"
            title="Generate with AI"
          >
            <Bot className="h-5 w-5 text-orange-500" />
            AI
          </button>

          {nodeTypes.map(({ type, icon: Icon, label, iconColor, surfaceClass }) => (
            <button
              key={type}
              onClick={() => addNodeFromPalette(type)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-700 shadow-sm transition hover:-translate-y-0.5 ${surfaceClass}`}
              title={`Add ${label}`}
            >
              <Icon className={`h-5 w-5 ${iconColor}`} />
              {compactLabels[type]}
            </button>
          ))}
        </div>

        <div className="mt-3 border-t border-slate-200/80 pt-3">
          <div className="flex w-full flex-col gap-2">
            <button
              onClick={onImport}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
              title="Import JSON"
            >
              <Upload className="h-5 w-5 text-slate-600" />
              Load
            </button>
            <button
              onClick={onExportJson}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
              title="Export JSON"
            >
              <FileJson className="h-5 w-5 text-slate-600" />
              Save
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
