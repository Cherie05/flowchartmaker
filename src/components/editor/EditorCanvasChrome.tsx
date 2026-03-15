import { Bot, FileJson, Keyboard, MousePointer2, Play } from 'lucide-react';
import { CanvasPill, EmptyStateStep } from './WorkspaceBits';

interface EditorCanvasChromeProps {
  hasNodes: boolean;
  connectingNodeLabel: string | null;
}

export function EditorCanvasChrome({
  hasNodes,
  connectingNodeLabel
}: EditorCanvasChromeProps) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,187,92,0.2),transparent_24%),radial-gradient(circle_at_82%_14%,rgba(124,173,255,0.16),transparent_26%),radial-gradient(circle_at_58%_82%,rgba(111,207,151,0.14),transparent_28%)]" />

      <div className="absolute inset-0 pointer-events-none opacity-70">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="workspace-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(100, 116, 139, 0.12)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#workspace-grid)" />
        </svg>
      </div>

      <div className="absolute left-5 top-5 z-30 flex flex-wrap items-center gap-2 md:left-6 md:top-6">
        <CanvasPill icon={MousePointer2} label="Double-click to add" />
        <CanvasPill icon={Bot} label="Use AI prompts on the right" />
        <CanvasPill icon={Keyboard} label="Scroll or Space-drag to pan" />
      </div>

      {connectingNodeLabel && (
        <div className="absolute right-5 top-5 z-30 max-w-xs rounded-2xl border border-orange-200 bg-orange-50/95 px-4 py-3 text-sm font-medium text-orange-900 shadow-lg shadow-orange-100 md:right-6 md:top-6">
          Pick another node handle to create a connection from <span className="font-semibold">{connectingNodeLabel}</span>.
        </div>
      )}

      {!hasNodes && (
        <div className="absolute inset-0 flex items-center justify-center px-6 py-16" style={{ zIndex: 20 }}>
          <div className="w-full max-w-3xl rounded-[32px] border border-white/85 bg-white/90 p-7 shadow-[0_28px_100px_-54px_rgba(15,23,42,0.42)] backdrop-blur-xl md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="max-w-xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-900">
                  <Bot className="h-3.5 w-3.5" />
                  Empty board
                </div>
                <h3 className="text-3xl leading-tight text-slate-900">Start mapping your workflow without the clutter.</h3>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  Use AI for a first draft, or drop in steps manually from the quick rail and sidebar. The board stays clean so the flow is always the focus.
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <Bot className="h-7 w-7" />
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <EmptyStateStep title="Draft quickly" description="Describe the process and generate a useful starting structure." />
              <EmptyStateStep title="Add steps fast" description="Double-click the canvas or use the quick-add rail for common shapes." />
              <EmptyStateStep title="Refine visually" description="Drag nodes, connect paths, rename steps, and export when ready." />
            </div>

            <p className="mt-6 text-sm font-medium text-slate-500">
              Tip: Press <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">/</span> to focus the AI composer.
            </p>
          </div>
        </div>
      )}

      {hasNodes && (
        <div className="absolute bottom-5 left-5 z-30 flex flex-wrap items-center gap-2 md:bottom-6 md:left-6">
          <CanvasPill icon={FileJson} label="Import or export JSON" />
          <CanvasPill icon={Play} label="Start with templates" />
        </div>
      )}

      {hasNodes && (
        <div className="absolute bottom-5 right-5 z-30 rounded-2xl border border-white/80 bg-white/88 px-4 py-3 text-sm text-slate-600 shadow-lg shadow-slate-200/40 backdrop-blur md:bottom-6 md:right-6">
          <span className="font-semibold text-slate-900">Autosave:</span> Changes are stored locally after a short pause.
        </div>
      )}
    </>
  );
}
