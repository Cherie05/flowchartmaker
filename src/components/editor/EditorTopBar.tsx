import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Check, ChevronDown, ChevronUp, Download, FileJson, Image as ImageIcon, Loader, Moon, Redo, Save, Sun, Undo, Play } from 'lucide-react';
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
  onExportPng?: (transparent: boolean) => void;
  onExportSvg?: (transparent: boolean) => void;
  onExportPdf?: () => void;
  onExportJson?: () => void;
  onPresent?: () => void;
  onClose?: () => void;
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
  onThemeChange,
  onExportPng,
  onExportSvg,
  onExportPdf,
  onExportJson,
  onPresent,
  onClose
}: EditorTopBarProps) {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isTransparent, setIsTransparent] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDark = workspaceTheme === 'dark';
  const shellClass = isDark
    ? 'border-white/8 bg-[#151517]/96 shadow-[0_18px_50px_-38px_rgba(0,0,0,0.8)]'
    : 'border-slate-200/80 bg-[#f7f3ea]/94 shadow-[0_18px_48px_-38px_rgba(148,163,184,0.55)]';
  const backButtonClass = isDark
    ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:bg-white/[0.08]'
    : 'border-slate-200 bg-white/85 text-slate-700 hover:border-slate-300 hover:bg-white';
  const titleClass = isDark ? 'text-slate-50 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400';
  const actionButtonClass = isDark
    ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:bg-white/[0.08]'
    : 'border-slate-200 bg-white/88 text-slate-700 hover:border-slate-300 hover:bg-white';
  const themeShellClass = isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white/88';

  return (
    <header className={`relative z-50 border-b px-4 py-3 backdrop-blur-xl lg:px-5 ${shellClass}`}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/5 text-slate-500'}`}
              title="Hide header"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          )}


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
            onClick={onPresent}
            className={`inline-flex items-center gap-2 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-600 transition hover:bg-sky-500/20 dark:text-sky-400`}
          >
            <Play className="h-4 w-4" />
            Present
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-sm font-medium transition ${actionButtonClass}`}
            >
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-4 w-4 opacity-70" />
            </button>

            {isExportMenuOpen && (
              <div className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border p-2 shadow-xl z-50 ${
                isDark ? 'border-white/10 bg-[#1b1c20]' : 'border-slate-200 bg-white'
              }`}>
                <div className={`px-3 py-2 text-[11px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Export as Image
                </div>
                <button
                  onClick={() => { onExportPng?.(isTransparent); setIsExportMenuOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isDark ? 'text-slate-200 hover:bg-white/[0.06]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ImageIcon className="h-4 w-4 opacity-70" />
                  PNG Image
                </button>
                <button
                  onClick={() => { onExportSvg?.(isTransparent); setIsExportMenuOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isDark ? 'text-slate-200 hover:bg-white/[0.06]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ImageIcon className="h-4 w-4 opacity-70" />
                  SVG Vector
                </button>

                <label className={`mt-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition ${
                  isDark ? 'text-slate-400 hover:bg-white/[0.04]' : 'text-slate-500 hover:bg-slate-50'
                }`}>
                  <div className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                    isTransparent
                      ? isDark ? 'border-sky-500 bg-sky-500' : 'border-sky-500 bg-sky-500'
                      : isDark ? 'border-white/20 bg-transparent' : 'border-slate-300 bg-transparent'
                  }`}>
                    {isTransparent && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isTransparent}
                    onChange={(e) => setIsTransparent(e.target.checked)}
                  />
                  Transparent background
                </label>

                <div className={`my-2 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`} />

                <div className={`px-3 py-2 text-[11px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Export Document
                </div>
                <button
                  onClick={() => { onExportPdf?.(); setIsExportMenuOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isDark ? 'text-slate-200 hover:bg-white/[0.06]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FileJson className="h-4 w-4 opacity-70" />
                  PDF Document
                </button>
                <button
                  onClick={() => { onExportJson?.(); setIsExportMenuOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isDark ? 'text-slate-200 hover:bg-white/[0.06]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FileJson className="h-4 w-4 opacity-70" />
                  JSON Data
                </button>
              </div>
            )}
          </div>
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
