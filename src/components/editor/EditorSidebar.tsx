import type { Ref } from 'react';
import { Bot, Circle, Download, FileJson, Keyboard, Loader, MousePointer2, Square, Trash2, Upload } from 'lucide-react';
import type { Connection, ConnectionMarker, ConnectionType, FlowChartNode } from '../../types/flowChart';
import { SelectionMetric, ShortcutRow } from './WorkspaceBits';
import type { WorkspaceNodeType, WorkspaceTheme } from './types';

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
  selectedNodeCount: number;
  selectedConnectionData: Connection | null;
  selectedConnectionEndpoints: {
    from: FlowChartNode | null;
    to: FlowChartNode | null;
  } | null;
  updateNodeText: (text: string) => void;
  updateNodeType: (type: FlowChartNode['type']) => void;
  updateNodeStyle: (style: Partial<NonNullable<FlowChartNode['style']>>) => void;
  onDeleteSelectedNode: () => void;
  onDeleteSelectedNodes: () => void;
  onDeleteSelectedConnection: () => void;
  updateConnectionLabel: (label: string) => void;
  updateConnectionType: (type: ConnectionType) => void;
  updateConnectionMarker: (side: 'startMarker' | 'endMarker', marker: ConnectionMarker) => void;
  updateConnectionColor: (color: string) => void;
  onImport: () => void;
  onExportJson: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportPdf: () => void;
  onClearBoard: () => void;
  workspaceTheme: WorkspaceTheme;
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
  selectedNodeCount,
  selectedConnectionData,
  selectedConnectionEndpoints,
  updateNodeText,
  updateNodeType,
  updateNodeStyle,
  onDeleteSelectedNode,
  onDeleteSelectedNodes,
  onDeleteSelectedConnection,
  updateConnectionLabel,
  updateConnectionType,
  updateConnectionMarker,
  updateConnectionColor,
  onImport,
  onExportJson,
  onExportPng,
  onExportSvg,
  onExportPdf,
  onClearBoard,
  workspaceTheme
}: EditorSidebarProps) {
  const isDark = workspaceTheme === 'dark';
  const asideClass = isDark
    ? 'xl:border-white/8 xl:bg-[#151517]'
    : 'xl:border-slate-200/80 xl:bg-[#f4efe6]';
  const sectionClass = isDark
    ? 'border-white/10 bg-[#1b1c20] shadow-[0_24px_70px_-52px_rgba(0,0,0,0.6)]'
    : 'border-white/90 bg-white/92 shadow-[0_24px_65px_-50px_rgba(148,163,184,0.5)]';
  const sectionKickerClass = isDark ? 'text-slate-500' : 'text-slate-500';
  const sectionTitleClass = isDark ? 'text-slate-100' : 'text-slate-900';
  const sectionCopyClass = isDark ? 'text-slate-500' : 'text-slate-600';
  const iconShellClass = isDark ? 'bg-white/[0.05] text-slate-300' : 'bg-slate-100 text-slate-600';
  const fieldClass = isDark
    ? 'border-white/10 bg-[#131419] text-slate-100 placeholder:text-slate-500 focus:border-orange-400/40 focus:ring-orange-500/15'
    : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-orange-300 focus:ring-orange-200';
  const softCardClass = isDark ? 'border-white/10 bg-[#131419]' : 'border-slate-200 bg-[#fcfaf6]';
  const softTextClass = isDark ? 'text-slate-400' : 'text-slate-600';
  const softStrongTextClass = isDark ? 'text-slate-100' : 'text-slate-900';
  const starterPromptClass = isDark
    ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-orange-400/30 hover:bg-orange-500/10 hover:text-orange-100'
    : 'border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700';

  return (
    <aside className={`w-full shrink-0 xl:flex xl:h-full xl:w-[360px] xl:min-h-0 xl:border-l ${asideClass}`}>
      <div className="space-y-4 p-4 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pr-3">
        {errorMessage && (
          <div
            className={`rounded-[24px] border px-4 py-3 text-sm shadow-sm ${
              isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {errorMessage}
          </div>
        )}

        <section className={`rounded-[24px] border p-5 ${sectionClass}`}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${sectionKickerClass}`}>AI Composer</p>
              <h3 className={`mt-1 text-lg font-semibold ${sectionTitleClass}`}>Generate a first draft</h3>
              <p className={`mt-1 text-sm leading-6 ${sectionCopyClass}`}>
                Write a simple prompt and use the result as a starting point, not the final board.
              </p>
            </div>
            <div className={`rounded-2xl p-2 ${isDark ? 'bg-orange-500/10 text-orange-300' : 'bg-orange-100 text-orange-600'}`}>
              <Bot className="h-5 w-5" />
            </div>
          </div>

          <textarea
            ref={aiTextareaRef}
            value={aiDescription}
            onChange={(e) => onAiDescriptionChange(e.target.value)}
            placeholder="Describe the workflow you want to map. Example: a customer support escalation process with triage, handoff, approval, and closure."
            className={`min-h-[112px] w-full rounded-[20px] border px-4 py-3 text-sm leading-6 outline-none transition focus:ring-2 ${fieldClass}`}
            disabled={isGenerating}
          />

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onStarterPromptClick(prompt)}
                className={`rounded-2xl border px-3 py-2 text-left text-xs font-medium leading-5 transition ${starterPromptClass}`}
              >
                {prompt}
              </button>
            ))}
          </div>

          <button
            onClick={onGenerate}
            disabled={!aiDescription.trim() || isGenerating}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {isGenerating ? <Loader className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            {isGenerating ? 'Generating board...' : 'Generate with AI'}
          </button>
        </section>

        <section className={`rounded-[24px] border p-5 ${sectionClass}`}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${sectionKickerClass}`}>Quick Add</p>
              <h3 className={`mt-1 text-lg font-semibold ${sectionTitleClass}`}>Common shapes</h3>
            </div>
            <div className={`rounded-2xl p-2 ${iconShellClass}`}>
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
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/15 shadow-sm">
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-950">{label}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-700">{description}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className={`rounded-[24px] border p-5 ${sectionClass}`}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${sectionKickerClass}`}>Inspector</p>
              <h3 className={`mt-1 text-lg font-semibold ${sectionTitleClass}`}>
                {selectedNodeData
                  ? 'Edit selected node'
                  : selectedNodeCount > 1
                    ? 'Multi-selection'
                    : selectedConnectionData
                      ? 'Selected connection'
                      : 'Nothing selected'}
              </h3>
            </div>
            <div className={`rounded-2xl p-2 ${iconShellClass}`}>
              {selectedNodeData ? <Square className="h-5 w-5" /> : selectedConnectionData ? <Circle className="h-5 w-5" /> : <MousePointer2 className="h-5 w-5" />}
            </div>
          </div>

          {selectedNodeData ? (
            <div className="space-y-4">
              <div className={`rounded-[20px] border p-4 ${softCardClass}`}>
                <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.22em] ${sectionKickerClass}`}>
                  Node label
                </label>
                <input
                  value={selectedNodeData.text}
                  onChange={(e) => updateNodeText(e.target.value)}
                  className={`w-full bg-transparent text-base font-medium outline-none ${
                    isDark ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
                  }`}
                  placeholder="Describe this step"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <SelectionMetric label="Type" value={selectedNodeData.type} theme={workspaceTheme} />
                <SelectionMetric
                  label="Position"
                  value={`${Math.round(selectedNodeData.position.x)}, ${Math.round(selectedNodeData.position.y)}`}
                  theme={workspaceTheme}
                />
                <SelectionMetric label="Width" value={`${selectedNodeData.width}px`} theme={workspaceTheme} />
                <SelectionMetric label="Height" value={`${selectedNodeData.height}px`} theme={workspaceTheme} />
              </div>

              <div className={`grid grid-cols-2 gap-3 rounded-[20px] border p-4 ${softCardClass}`}>
                <label className={`text-xs font-semibold uppercase tracking-[0.22em] ${sectionKickerClass}`}>
                  Shape
                  <select
                    value={selectedNodeData.type}
                    onChange={(e) => updateNodeType(e.target.value as FlowChartNode['type'])}
                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm font-medium outline-none ${
                      isDark ? 'border-white/10 bg-[#0f1116] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  >
                    {nodeTypes.map((nodeType) => (
                      <option key={nodeType.type} value={nodeType.type}>
                        {nodeType.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={`text-xs font-semibold uppercase tracking-[0.22em] ${sectionKickerClass}`}>
                  Border
                  <select
                    value={selectedNodeData.style?.borderStyle ?? 'solid'}
                    onChange={(e) =>
                      updateNodeStyle({ borderStyle: e.target.value as NonNullable<FlowChartNode['style']>['borderStyle'] })
                    }
                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm font-medium outline-none ${
                      isDark ? 'border-white/10 bg-[#0f1116] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="none">Hidden</option>
                  </select>
                </label>

                <ColorField
                  label="Fill"
                  value={selectedNodeData.style?.backgroundColor ?? '#ffffff'}
                  onChange={(value) => updateNodeStyle({ backgroundColor: value })}
                  workspaceTheme={workspaceTheme}
                />
                <ColorField
                  label="Border Color"
                  value={selectedNodeData.style?.borderColor ?? '#cbd5e1'}
                  onChange={(value) => updateNodeStyle({ borderColor: value })}
                  workspaceTheme={workspaceTheme}
                />
                <ColorField
                  label="Text Color"
                  value={selectedNodeData.style?.textColor ?? '#0f172a'}
                  onChange={(value) => updateNodeStyle({ textColor: value })}
                  workspaceTheme={workspaceTheme}
                />

                <label className={`text-xs font-semibold uppercase tracking-[0.22em] ${sectionKickerClass}`}>
                  Font Size
                  <input
                    type="number"
                    min={10}
                    max={24}
                    value={selectedNodeData.style?.fontSize ?? 12}
                    onChange={(e) => updateNodeStyle({ fontSize: Number(e.target.value) || 12 })}
                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm font-medium outline-none ${
                      isDark ? 'border-white/10 bg-[#0f1116] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  />
                </label>
              </div>

              <button
                onClick={onDeleteSelectedNode}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15"
              >
                <Trash2 className="h-4 w-4" />
                Delete selected node
              </button>
            </div>
          ) : selectedNodeCount > 1 ? (
            <div className="space-y-4">
              <div className={`rounded-[20px] border p-4 text-sm ${softCardClass} ${softTextClass}`}>
                <p className={`font-medium ${softStrongTextClass}`}>{selectedNodeCount} nodes selected</p>
                <p className="mt-2">Drag to move them together, use arrow keys to nudge, or duplicate with `Ctrl/Cmd + D`.</p>
              </div>

              <button
                onClick={onDeleteSelectedNodes}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15"
              >
                <Trash2 className="h-4 w-4" />
                Delete selection
              </button>
            </div>
          ) : selectedConnectionData ? (
            <div className="space-y-4">
              <div className={`rounded-[20px] border p-4 text-sm ${softCardClass} ${softTextClass}`}>
                <p className={`font-medium ${softStrongTextClass}`}>
                  {selectedConnectionEndpoints?.from?.text ?? 'Unknown'} to {selectedConnectionEndpoints?.to?.text ?? 'Unknown'}
                </p>
                <p className="mt-2">
                  {selectedConnectionData.fromSide} to {selectedConnectionData.toSide}
                </p>
                <p className={`mt-1 ${sectionCopyClass}`}>
                  {selectedConnectionData.label ? `Label: ${selectedConnectionData.label}` : 'No label on this connection.'}
                </p>
              </div>

              <div className={`grid grid-cols-2 gap-3 rounded-[20px] border p-4 ${softCardClass}`}>
                <label className={`col-span-2 text-xs font-semibold uppercase tracking-[0.22em] ${sectionKickerClass}`}>
                  Label
                  <input
                    value={selectedConnectionData.label ?? ''}
                    onChange={(e) => updateConnectionLabel(e.target.value)}
                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm font-medium outline-none ${
                      isDark ? 'border-white/10 bg-[#0f1116] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                    }`}
                    placeholder="Label this connector"
                  />
                </label>

                <label className={`text-xs font-semibold uppercase tracking-[0.22em] ${sectionKickerClass}`}>
                  Path
                  <select
                    value={selectedConnectionData.type ?? 'curved'}
                    onChange={(e) => updateConnectionType(e.target.value as ConnectionType)}
                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm font-medium outline-none ${
                      isDark ? 'border-white/10 bg-[#0f1116] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  >
                    <option value="curved">Curved</option>
                    <option value="straight">Straight</option>
                    <option value="elbow">Elbow</option>
                  </select>
                </label>

                <ColorField
                  label="Stroke"
                  value={selectedConnectionData.color ?? '#64748b'}
                  onChange={updateConnectionColor}
                  workspaceTheme={workspaceTheme}
                />

                <label className={`text-xs font-semibold uppercase tracking-[0.22em] ${sectionKickerClass}`}>
                  Start
                  <select
                    value={selectedConnectionData.startMarker ?? 'none'}
                    onChange={(e) => updateConnectionMarker('startMarker', e.target.value as ConnectionMarker)}
                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm font-medium outline-none ${
                      isDark ? 'border-white/10 bg-[#0f1116] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  >
                    <option value="none">None</option>
                    <option value="arrow">Arrow</option>
                  </select>
                </label>

                <label className={`text-xs font-semibold uppercase tracking-[0.22em] ${sectionKickerClass}`}>
                  End
                  <select
                    value={selectedConnectionData.endMarker ?? 'arrow'}
                    onChange={(e) => updateConnectionMarker('endMarker', e.target.value as ConnectionMarker)}
                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm font-medium outline-none ${
                      isDark ? 'border-white/10 bg-[#0f1116] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  >
                    <option value="none">None</option>
                    <option value="arrow">Arrow</option>
                  </select>
                </label>
              </div>

              <button
                onClick={onDeleteSelectedConnection}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15"
              >
                <Trash2 className="h-4 w-4" />
                Delete connection
              </button>
            </div>
          ) : (
            <div
              className={`rounded-[20px] border border-dashed p-4 text-sm leading-6 ${
                isDark ? 'border-white/10 bg-[#131419] text-slate-400' : 'border-slate-200 bg-[#fcfaf6] text-slate-600'
              }`}
            >
              Select a node or connection on the canvas to inspect it here. This keeps edits close to the board and out of the way of the workspace.
            </div>
          )}
        </section>

        <section className={`rounded-[24px] border p-5 ${sectionClass}`}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${sectionKickerClass}`}>Board Actions</p>
              <h3 className={`mt-1 text-lg font-semibold ${sectionTitleClass}`}>Import, export, reset</h3>
            </div>
            <div className={`rounded-2xl p-2 ${iconShellClass}`}>
              <FileJson className="h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ActionButton icon={Upload} label="Import JSON" onClick={onImport} workspaceTheme={workspaceTheme} />
            <ActionButton icon={Download} label="Export JSON" onClick={onExportJson} workspaceTheme={workspaceTheme} />
            <ActionButton icon={Download} label="Export PNG" onClick={onExportPng} workspaceTheme={workspaceTheme} />
            <ActionButton icon={Download} label="Export SVG" onClick={onExportSvg} workspaceTheme={workspaceTheme} />
            <ActionButton icon={Download} label="Export PDF" onClick={onExportPdf} workspaceTheme={workspaceTheme} />
            <button
              onClick={onClearBoard}
              className="col-span-2 inline-flex items-center justify-center gap-2 rounded-[20px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15"
            >
              <Trash2 className="h-4 w-4" />
              Clear board
            </button>
          </div>
        </section>

        <section className={`rounded-[24px] border p-5 ${sectionClass}`}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${sectionKickerClass}`}>Shortcuts</p>
              <h3 className={`mt-1 text-lg font-semibold ${sectionTitleClass}`}>Small moves, fast flow</h3>
            </div>
            <div className={`rounded-2xl p-2 ${iconShellClass}`}>
              <Keyboard className="h-5 w-5" />
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <ShortcutRow action="Double-click canvas" result="Add a process node quickly" theme={workspaceTheme} />
            <ShortcutRow action="Drag empty canvas" result="Marquee-select multiple nodes" theme={workspaceTheme} />
            <ShortcutRow action="Double-click node" result="Rename it inline" theme={workspaceTheme} />
            <ShortcutRow action="Alt + drag node" result="Pull out a connector to another block" theme={workspaceTheme} />
            <ShortcutRow action="Cmd/Ctrl + C / V / D" result="Copy, paste, or duplicate selection" theme={workspaceTheme} />
            <ShortcutRow action="Ctrl/Cmd + wheel" result="Zoom the workspace like a canvas tool" theme={workspaceTheme} />
            <ShortcutRow action="Alt + Arrow key" result="Create a connected step from the selected node" theme={workspaceTheme} />
            <ShortcutRow action="/" result="Open the command menu" theme={workspaceTheme} />
            <ShortcutRow action="Cmd/Ctrl + K" result="Open the command menu from anywhere" theme={workspaceTheme} />
            <ShortcutRow action="Cmd/Ctrl + S" result="Save the current board" theme={workspaceTheme} />
            <ShortcutRow action="Esc" result="Clear selection or exit link mode" theme={workspaceTheme} />
          </div>
        </section>
      </div>
    </aside>
  );
}

function ColorField({
  label,
  value,
  onChange,
  workspaceTheme
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  workspaceTheme: WorkspaceTheme;
}) {
  const isDark = workspaceTheme === 'dark';

  return (
    <label className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
      {label}
      <div
        className={`mt-2 flex items-center gap-3 rounded-xl border px-3 py-2 ${
          isDark ? 'border-white/10 bg-[#0f1116]' : 'border-slate-200 bg-white'
        }`}
      >
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 rounded border-0 bg-transparent p-0" />
        <span className={`text-sm font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{value}</span>
      </div>
    </label>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  workspaceTheme
}: {
  icon: typeof Upload;
  label: string;
  onClick: () => void;
  workspaceTheme: WorkspaceTheme;
}) {
  const isDark = workspaceTheme === 'dark';

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-[20px] border px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5 ${
        isDark
          ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:bg-white/[0.08]'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
