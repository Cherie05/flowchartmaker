import { useState, type ReactNode } from 'react';
import { Diamond, Keyboard, Map, Minus, MousePointer2, Move, Play, Plus, Square, X } from 'lucide-react';
import type { FlowChartNode } from '../../types/flowChart';
import { CanvasPill } from './WorkspaceBits';
import type { WorkspaceTheme } from './types';

const GUIDANCE_STORAGE_KEY = 'wizzleflow.workspace.guidance-dismissed';

interface EditorCanvasChromeProps {
  hasNodes: boolean;
  connectingNodeLabel: string | null;
  zoomLabel: string;
  showHints: boolean;
  showMinimap: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitCanvas: () => void;
  onFitSelection: () => void;
  onToggleMinimap: () => void;
  onAddNode: (type: FlowChartNode['type']) => void;
  onUseStarterTemplate: () => void;
  workspaceTheme: WorkspaceTheme;
}

export function EditorCanvasChrome(props: EditorCanvasChromeProps) {
  const isDark = props.workspaceTheme === 'dark';
  const [isDismissed, setIsDismissed] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem(GUIDANCE_STORAGE_KEY) === 'true');
  const dismiss = () => { window.localStorage.setItem(GUIDANCE_STORAGE_KEY, 'true'); setIsDismissed(true); };

  return (
    <>
      {props.showHints && (
        <div className="pointer-events-none absolute left-4 top-4 z-30 flex flex-wrap items-center gap-2">
          <CanvasPill icon={MousePointer2} label="Double-click to add" theme={props.workspaceTheme} />
          <CanvasPill icon={Move} label="Drag empty space to select" theme={props.workspaceTheme} />
          <CanvasPill icon={Keyboard} label="Press / for commands" theme={props.workspaceTheme} />
        </div>
      )}

      {props.connectingNodeLabel && (
        <div role="status" className={`pointer-events-none absolute right-4 top-4 z-30 max-w-xs rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${isDark ? 'border-violet-400/30 bg-slate-900/95 text-violet-100' : 'border-violet-200 bg-white/95 text-violet-800'}`}>
          Choose a target handle for the connection from <strong>{props.connectingNodeLabel}</strong>.
        </div>
      )}

      {!props.hasNodes && !isDismissed && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-5">
          <section aria-labelledby="empty-canvas-title" className={`pointer-events-auto relative w-full max-w-2xl rounded-3xl border p-6 shadow-2xl backdrop-blur-xl ${isDark ? 'border-white/10 bg-[#191b20]/95 text-white' : 'border-white bg-white/95 text-slate-950'}`}>
            <button type="button" onClick={dismiss} aria-label="Dismiss getting started guide" className={`absolute right-4 top-4 rounded-lg p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${isDark ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'}`}><X className="h-4 w-4" aria-hidden="true" /></button>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Getting started</p>
            <h2 id="empty-canvas-title" className="mt-2 text-3xl font-bold tracking-tight">Add your first step</h2>
            <p className={`mt-3 max-w-xl leading-7 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Choose a common shape, drag between node handles to connect steps, and use the inspector to edit a selection. Changes save automatically in this browser.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAction icon={Play} label="Start" onClick={() => props.onAddNode('start')} dark={isDark} />
              <QuickAction icon={Square} label="Process" onClick={() => props.onAddNode('process')} dark={isDark} />
              <QuickAction icon={Diamond} label="Decision" onClick={() => props.onAddNode('decision')} dark={isDark} />
              <QuickAction icon={Map} label="Approval starter" onClick={props.onUseStarterTemplate} dark={isDark} />
            </div>
            <p className={`mt-5 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Keyboard: R adds a process, D adds a decision, and Ctrl/Cmd+Z undoes a change.</p>
          </section>
        </div>
      )}

      {!props.hasNodes && isDismissed && (
        <button type="button" onClick={() => setIsDismissed(false)} className={`absolute left-4 top-4 z-30 rounded-xl border px-3 py-2 text-xs font-semibold shadow-lg ${isDark ? 'border-white/10 bg-slate-900/90 text-slate-200' : 'border-slate-200 bg-white/90 text-slate-700'}`}>Getting started</button>
      )}

      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2">
        <div className={`pointer-events-auto inline-flex items-center gap-1 rounded-xl border p-1.5 shadow-lg backdrop-blur ${isDark ? 'border-white/10 bg-[#1f2126]/95' : 'border-white bg-white/95'}`}>
          <ControlButton label="Zoom out" onClick={props.onZoomOut} dark={isDark}><Minus className="h-4 w-4" /></ControlButton>
          <button type="button" onClick={props.onResetZoom} title="Reset zoom" className={`min-w-16 rounded-lg px-2 py-2 text-xs font-semibold ${isDark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}>{props.zoomLabel}</button>
          <ControlButton label="Zoom in" onClick={props.onZoomIn} dark={isDark}><Plus className="h-4 w-4" /></ControlButton>
          <button type="button" onClick={props.onFitCanvas} className={`rounded-lg px-3 py-2 text-xs font-semibold ${isDark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}>Fit</button>
          <button type="button" onClick={props.onFitSelection} className={`rounded-lg px-3 py-2 text-xs font-semibold ${isDark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}>Selection</button>
          <ControlButton label={props.showMinimap ? 'Hide minimap' : 'Show minimap'} onClick={props.onToggleMinimap} dark={isDark} active={props.showMinimap}><Map className="h-4 w-4" /></ControlButton>
        </div>
      </div>
    </>
  );
}

function QuickAction({ icon: Icon, label, onClick, dark }: { icon: typeof Play; label: string; onClick: () => void; dark: boolean }) {
  return <button type="button" onClick={onClick} className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300 ${dark ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.09]' : 'border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50'}`}><Icon className="h-4 w-4 text-violet-600" aria-hidden="true" />{label}</button>;
}

function ControlButton({ label, onClick, dark, active = false, children }: { label: string; onClick: () => void; dark: boolean; active?: boolean; children: ReactNode }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${active ? 'bg-violet-100 text-violet-700' : dark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}>{children}</button>;
}
