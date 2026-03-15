import { ArrowLeft, Check, Loader, Redo, Save, Undo } from 'lucide-react';
import { WorkspaceChip } from './WorkspaceBits';

interface EditorTopBarProps {
  flowchartName: string;
  onNameChange: (value: string) => void;
  onBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
  justSaved: boolean;
  nodeCount: number;
  connectionCount: number;
  isLinking: boolean;
}

export function EditorTopBar({
  flowchartName,
  onNameChange,
  onBack,
  onUndo,
  onRedo,
  onSave,
  canUndo,
  canRedo,
  isSaving,
  justSaved,
  nodeCount,
  connectionCount,
  isLinking
}: EditorTopBarProps) {
  return (
    <header className="rounded-[28px] border border-white/80 bg-white/82 px-4 py-4 shadow-[0_22px_80px_-52px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] text-slate-700">Workspace</span>
            <span>Canvas-first</span>
            <span>Quick editing</span>
            <span>Local autosave</span>
          </div>

          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
              title="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <input
                type="text"
                value={flowchartName}
                onChange={(e) => onNameChange(e.target.value)}
                className="w-full min-w-0 bg-transparent text-2xl font-semibold tracking-tight text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Name your board"
              />
              <p className="text-sm text-slate-500">
                Double-click to add, drag to arrange, and use the right panel for AI or inspector details.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Undo className="h-4 w-4" />
            Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Redo className="h-4 w-4" />
            Redo
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {justSaved ? <Check className="h-4 w-4" /> : isSaving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {justSaved ? 'Saved' : isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <WorkspaceChip label="Nodes" value={String(nodeCount)} />
        <WorkspaceChip label="Connections" value={String(connectionCount)} />
        <WorkspaceChip label="Mode" value={isLinking ? 'Linking' : 'Editing'} accent={isLinking} />
        <WorkspaceChip label="Storage" value="Local board" />
      </div>
    </header>
  );
}
