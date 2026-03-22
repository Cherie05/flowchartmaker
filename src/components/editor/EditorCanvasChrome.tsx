import { Bot, FileJson, Keyboard, Minus, MousePointer2, Move, Play, Plus } from 'lucide-react';
import { CanvasPill, EmptyStateStep } from './WorkspaceBits';
import type { WorkspaceTheme } from './types';

interface EditorCanvasChromeProps {
  hasNodes: boolean;
  connectingNodeLabel: string | null;
  zoomLabel: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitCanvas: () => void;
  workspaceTheme: WorkspaceTheme;
}

export function EditorCanvasChrome({
  hasNodes,
  connectingNodeLabel,
  zoomLabel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitCanvas,
  workspaceTheme
}: EditorCanvasChromeProps) {
  const isDark = workspaceTheme === 'dark';

  return (
    <>
      <div className="pointer-events-none absolute left-5 top-5 z-30 flex flex-wrap items-center gap-2 md:left-6 md:top-6">
        <CanvasPill icon={MousePointer2} label="Double-click to add" theme={workspaceTheme} />
        <CanvasPill icon={Move} label="Space-drag or middle mouse to pan" theme={workspaceTheme} />
        <CanvasPill icon={Keyboard} label="Ctrl/Cmd + wheel to zoom" theme={workspaceTheme} />
        <CanvasPill icon={Bot} label="Use AI prompts on the right" theme={workspaceTheme} />
      </div>

      {connectingNodeLabel && (
        <div
          className={`pointer-events-none absolute right-5 top-5 z-30 max-w-xs rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg md:right-6 md:top-6 ${
            isDark
              ? 'border-orange-500/30 bg-[#261b11]/95 text-orange-100 shadow-black/30'
              : 'border-orange-200 bg-white/95 text-orange-700 shadow-[0_20px_48px_-30px_rgba(251,146,60,0.45)]'
          }`}
        >
          Pick another node handle to create a connection from <span className="font-semibold">{connectingNodeLabel}</span>.
        </div>
      )}

      {!hasNodes && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 py-16" style={{ zIndex: 20 }}>
          <div
            className={`w-full max-w-3xl rounded-[32px] border p-7 backdrop-blur-xl md:p-8 ${
              isDark
                ? 'border-white/10 bg-[#1b1c20]/92 shadow-[0_28px_100px_-54px_rgba(0,0,0,0.75)]'
                : 'border-white/80 bg-white/90 shadow-[0_30px_110px_-58px_rgba(148,163,184,0.6)]'
            }`}
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="max-w-xl">
                <div
                  className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                    isDark
                      ? 'border-sky-500/20 bg-sky-500/10 text-sky-100'
                      : 'border-sky-200 bg-sky-50 text-sky-700'
                  }`}
                >
                  <Bot className="h-3.5 w-3.5" />
                  Infinite board
                </div>
                <h3 className={`text-3xl leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Build flowcharts on a bigger, Figma-style workspace.
                </h3>
                <p className={`mt-3 text-base leading-7 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Keep your flowchart content in the center, use the side panels for tools and properties, and move across a much larger board with pan and zoom.
                </p>
              </div>

              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                  isDark ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-100 text-sky-700'
                }`}
              >
                <Bot className="h-7 w-7" />
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <EmptyStateStep
                title="Draft quickly"
                description="Describe the process and generate a useful starting structure."
                theme={workspaceTheme}
              />
              <EmptyStateStep
                title="Add steps fast"
                description="Double-click the canvas or use the quick-add rail for common shapes."
                theme={workspaceTheme}
              />
              <EmptyStateStep
                title="Navigate freely"
                description="Scroll, pan, and zoom across a much larger board without cutoffs."
                theme={workspaceTheme}
              />
            </div>

            <p className={`mt-6 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Tip:{' '}
              <span
                className={`rounded px-2 py-1 ${
                  isDark ? 'bg-white/[0.08] text-slate-100' : 'bg-slate-100 text-slate-700'
                }`}
              >
                /
              </span>{' '}
              to focus the AI composer.
            </p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-5 left-5 z-30 flex flex-wrap items-center gap-2 md:bottom-6 md:left-6">
        <CanvasPill icon={FileJson} label="Import or export JSON" theme={workspaceTheme} />
        <CanvasPill icon={Play} label="Start with templates" theme={workspaceTheme} />
      </div>

      <div className="absolute bottom-5 right-5 z-30 flex flex-wrap items-center justify-end gap-3 md:bottom-6 md:right-6">
        <div
          className={`pointer-events-none rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${
            isDark
              ? 'border-white/10 bg-[#1f2026]/92 text-slate-400 shadow-black/30'
              : 'border-white/80 bg-white/92 text-slate-600 shadow-[0_20px_45px_-28px_rgba(148,163,184,0.55)]'
          }`}
        >
          <span className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Autosave:</span> Changes are stored locally after a short pause.
        </div>

        <div
          className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-2xl border px-2 py-2 shadow-lg backdrop-blur ${
            isDark
              ? 'border-white/10 bg-[#1f2026]/94 shadow-black/30'
              : 'border-white/80 bg-white/94 shadow-[0_20px_45px_-28px_rgba(148,163,184,0.55)]'
          }`}
        >
          <button
            onClick={onZoomOut}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${
              isDark
                ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:bg-white/[0.08]'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
            title="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={onResetZoom}
            className={`inline-flex min-w-[72px] items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              isDark
                ? 'border-white/10 bg-white/[0.04] text-slate-100 hover:border-white/20 hover:bg-white/[0.08]'
                : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
            }`}
            title="Reset zoom"
          >
            {zoomLabel}
          </button>
          <button
            onClick={onZoomIn}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${
              isDark
                ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:bg-white/[0.08]'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
            title="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={onFitCanvas}
            className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              isDark
                ? 'border-white/10 bg-white/[0.04] text-slate-100 hover:border-white/20 hover:bg-white/[0.08]'
                : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
            }`}
            title="Fit flowchart to viewport"
          >
            Fit
          </button>
        </div>
      </div>
    </>
  );
}
