import { ArrowLeft, Check, Loader, Moon, Redo, Save, Sun, Undo } from 'lucide-react';
import { WorkspaceChip } from './WorkspaceBits';
import type { WorkspaceTheme } from './types';

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
  workspaceTheme: WorkspaceTheme;
  onThemeChange: (theme: WorkspaceTheme) => void;
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
  isLinking,
  workspaceTheme,
  onThemeChange
}: EditorTopBarProps) {
  const isDark = workspaceTheme === 'dark';
  const shellClass = isDark
    ? 'border-white/8 bg-[#151517]/96 shadow-[0_18px_50px_-38px_rgba(0,0,0,0.8)]'
    : 'border-slate-200/80 bg-[#f7f3ea]/94 shadow-[0_18px_48px_-38px_rgba(148,163,184,0.55)]';
  const metaTextClass = isDark ? 'text-slate-500' : 'text-slate-500';
  const badgeClass = isDark
    ? 'border-white/10 bg-white/[0.04] text-slate-300'
    : 'border-slate-200 bg-white/85 text-slate-600';
  const backButtonClass = isDark
    ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:bg-white/[0.08]'
    : 'border-slate-200 bg-white/85 text-slate-700 hover:border-slate-300 hover:bg-white';
  const titleClass = isDark ? 'text-slate-50 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400';
  const subtitleClass = isDark ? 'text-slate-400' : 'text-slate-600';
  const actionButtonClass = isDark
    ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:bg-white/[0.08]'
    : 'border-slate-200 bg-white/88 text-slate-700 hover:border-slate-300 hover:bg-white';
  const themeShellClass = isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white/88';

  return (
    <header className={`border-b px-4 py-3 backdrop-blur-xl lg:px-5 ${shellClass}`}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className={`mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] ${metaTextClass}`}>
            <span className={`rounded-full border px-3 py-1 text-[10px] ${badgeClass}`}>Flow Workspace</span>
            <span>Infinite board</span>
            <span>Pan + zoom</span>
            <span>Local autosave</span>
          </div>

          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={onBack}
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition ${backButtonClass}`}
              title="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <input
                type="text"
                value={flowchartName}
                onChange={(e) => onNameChange(e.target.value)}
                className={`w-full min-w-0 bg-transparent text-2xl font-semibold tracking-tight outline-none ${titleClass}`}
                placeholder="Name your board"
              />
              <p className={`text-sm ${subtitleClass}`}>
                Larger canvas, Figma-style navigation, and your flowchart controls kept close to the work.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <div className={`inline-flex items-center gap-1 rounded-2xl border p-1 ${themeShellClass}`}>
            <button
              onClick={() => onThemeChange('dark')}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                workspaceTheme === 'dark'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : isDark
                    ? 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Use dark workspace"
            >
              <Moon className="h-4 w-4" />
              Dark
            </button>
            <button
              onClick={() => onThemeChange('light')}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                workspaceTheme === 'light'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : isDark
                    ? 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Use light workspace"
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
          </div>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${actionButtonClass}`}
          >
            <Undo className="h-4 w-4" />
            Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${actionButtonClass}`}
          >
            <Redo className="h-4 w-4" />
            Redo
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
          >
            {justSaved ? <Check className="h-4 w-4" /> : isSaving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {justSaved ? 'Saved' : isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <WorkspaceChip label="Nodes" value={String(nodeCount)} theme={workspaceTheme} />
        <WorkspaceChip label="Connections" value={String(connectionCount)} theme={workspaceTheme} />
        <WorkspaceChip
          label="Mode"
          value={isLinking ? 'Linking' : 'Editing'}
          accent={isLinking}
          theme={workspaceTheme}
        />
        <WorkspaceChip label="Storage" value="Local board" theme={workspaceTheme} />
      </div>
    </header>
  );
}
