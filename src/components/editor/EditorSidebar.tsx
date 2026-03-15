import type { Ref } from 'react';
import { Bot, Circle, Download, FileJson, Keyboard, Loader, MousePointer2, Square, Trash2, Upload } from 'lucide-react';
import type { Connection, FlowChartNode } from '../../types/flowChart';
import { SelectionMetric, ShortcutRow } from './WorkspaceBits';
import type { WorkspaceNodeType } from './types';

interface EditorSidebarProps {
  errorMessage: string;
  aiDescription: string;
  onAiDescriptionChange: (value: string) => void;
  starterPrompts: string[];
  onStarterPromptClick: (prompt: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  aiTextareaRef: Ref<HTMLTextAreaElement>;
  nodeTypes: WorkspaceNodeType[];
  addNodeFromPalette: (type: WorkspaceNodeType['type']) => void;
  selectedNodeData: FlowChartNode | null;
  selectedConnectionData: Connection | null;
  selectedConnectionEndpoints: {
    from: FlowChartNode | null;
    to: FlowChartNode | null;
  } | null;
  updateNodeText: (text: string) => void;
  onDeleteSelectedNode: () => void;
  onDeleteSelectedConnection: () => void;
  onImport: () => void;
  onExportJson: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onClearBoard: () => void;
}

export function EditorSidebar({
  errorMessage,
  aiDescription,
  onAiDescriptionChange,
  starterPrompts,
  onStarterPromptClick,
  onGenerate,
  isGenerating,
  aiTextareaRef,
  nodeTypes,
  addNodeFromPalette,
  selectedNodeData,
  selectedConnectionData,
  selectedConnectionEndpoints,
  updateNodeText,
  onDeleteSelectedNode,
  onDeleteSelectedConnection,
  onImport,
  onExportJson,
  onExportPng,
  onExportSvg,
  onClearBoard
}: EditorSidebarProps) {
  return (
    <aside className="w-full shrink-0 xl:flex xl:h-full xl:w-[344px] xl:min-h-0">
      <div className="space-y-4 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pr-1">
        {errorMessage && (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {errorMessage}
          </div>
        )}

        <section className="rounded-[24px] border border-white/80 bg-white/88 p-5 shadow-[0_20px_70px_-44px_rgba(15,23,42,0.42)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">AI Composer</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Generate a first draft</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Write a simple prompt and use the result as a starting point, not the final board.
              </p>
            </div>
            <div className="rounded-2xl bg-orange-100 p-2 text-orange-600">
              <Bot className="h-5 w-5" />
            </div>
          </div>

          <textarea
            ref={aiTextareaRef}
            value={aiDescription}
            onChange={(e) => onAiDescriptionChange(e.target.value)}
            placeholder="Describe the workflow you want to map. Example: a customer support escalation process with triage, handoff, approval, and closure."
            className="min-h-[112px] w-full rounded-[20px] border border-slate-200 bg-[#fbfbf8] px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            disabled={isGenerating}
          />

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onStarterPromptClick(prompt)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium leading-5 text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
              >
                {prompt}
              </button>
            ))}
          </div>

          <button
            onClick={onGenerate}
            disabled={!aiDescription.trim() || isGenerating}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isGenerating ? <Loader className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            {isGenerating ? 'Generating board...' : 'Generate with AI'}
          </button>
        </section>

        <section className="rounded-[24px] border border-white/80 bg-white/88 p-5 shadow-[0_20px_70px_-44px_rgba(15,23,42,0.42)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Quick Add</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Common shapes</h3>
            </div>
            <div className="rounded-2xl bg-slate-100 p-2 text-slate-600">
              <Square className="h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {nodeTypes.map(({ type, icon: Icon, label, description, iconColor, surfaceClass }) => (
              <button
                key={type}
                onClick={() => addNodeFromPalette(type)}
                className={`flex min-h-[132px] flex-col items-start gap-3 rounded-[20px] border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${surfaceClass}`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/75 shadow-sm">
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{label}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-600">{description}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/80 bg-white/88 p-5 shadow-[0_20px_70px_-44px_rgba(15,23,42,0.42)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Inspector</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                {selectedNodeData ? 'Edit selected node' : selectedConnectionData ? 'Selected connection' : 'Nothing selected'}
              </h3>
            </div>
            <div className="rounded-2xl bg-slate-100 p-2 text-slate-600">
              {selectedNodeData ? <Square className="h-5 w-5" /> : selectedConnectionData ? <Circle className="h-5 w-5" /> : <MousePointer2 className="h-5 w-5" />}
            </div>
          </div>

          {selectedNodeData ? (
            <div className="space-y-4">
              <div className="rounded-[20px] border border-slate-200 bg-[#fbfbf8] p-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Node label
                </label>
                <input
                  value={selectedNodeData.text}
                  onChange={(e) => updateNodeText(e.target.value)}
                  className="w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Describe this step"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <SelectionMetric label="Type" value={selectedNodeData.type} />
                <SelectionMetric
                  label="Position"
                  value={`${Math.round(selectedNodeData.position.x)}, ${Math.round(selectedNodeData.position.y)}`}
                />
                <SelectionMetric label="Width" value={`${selectedNodeData.width}px`} />
                <SelectionMetric label="Height" value={`${selectedNodeData.height}px`} />
              </div>

              <button
                onClick={onDeleteSelectedNode}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4" />
                Delete selected node
              </button>
            </div>
          ) : selectedConnectionData ? (
            <div className="space-y-4">
              <div className="rounded-[20px] border border-slate-200 bg-[#fbfbf8] p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">
                  {selectedConnectionEndpoints?.from?.text ?? 'Unknown'} to {selectedConnectionEndpoints?.to?.text ?? 'Unknown'}
                </p>
                <p className="mt-2">
                  {selectedConnectionData.fromSide} to {selectedConnectionData.toSide}
                </p>
                <p className="mt-1 text-slate-500">
                  {selectedConnectionData.label ? `Label: ${selectedConnectionData.label}` : 'No label on this connection.'}
                </p>
              </div>

              <button
                onClick={onDeleteSelectedConnection}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4" />
                Delete connection
              </button>
            </div>
          ) : (
            <div className="rounded-[20px] border border-dashed border-slate-200 bg-[#fbfbf8] p-4 text-sm leading-6 text-slate-600">
              Select a node or connection on the canvas to inspect it here. This keeps edits close to the board and out of the way of the workspace.
            </div>
          )}
        </section>

        <section className="rounded-[24px] border border-white/80 bg-white/88 p-5 shadow-[0_20px_70px_-44px_rgba(15,23,42,0.42)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Board Actions</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Import, export, reset</h3>
            </div>
            <div className="rounded-2xl bg-slate-100 p-2 text-slate-600">
              <FileJson className="h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ActionButton icon={Upload} label="Import JSON" onClick={onImport} />
            <ActionButton icon={Download} label="Export JSON" onClick={onExportJson} />
            <ActionButton icon={Download} label="Export PNG" onClick={onExportPng} />
            <ActionButton icon={Download} label="Export SVG" onClick={onExportSvg} />
            <button
              onClick={onClearBoard}
              className="col-span-2 inline-flex items-center justify-center gap-2 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <Trash2 className="h-4 w-4" />
              Clear board
            </button>
          </div>
        </section>

        <section className="rounded-[24px] border border-white/80 bg-white/88 p-5 shadow-[0_20px_70px_-44px_rgba(15,23,42,0.42)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Shortcuts</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Small moves, fast flow</h3>
            </div>
            <div className="rounded-2xl bg-slate-100 p-2 text-slate-600">
              <Keyboard className="h-5 w-5" />
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <ShortcutRow action="Double-click canvas" result="Add a process node quickly" />
            <ShortcutRow action="Double-click node" result="Rename it inline" />
            <ShortcutRow action="/" result="Jump to the AI composer" />
            <ShortcutRow action="Cmd/Ctrl + S" result="Save the current board" />
            <ShortcutRow action="Esc" result="Clear selection or exit link mode" />
          </div>
        </section>
      </div>
    </aside>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick
}: {
  icon: typeof Upload;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
