import type { Ref } from 'react';
import { Bot, Circle, Download, FileJson, Keyboard, Loader, Lock, MousePointer2, Square, Trash2, Unlock, Upload, ChevronRight } from 'lucide-react';
import type { Connection, ConnectionMarker, ConnectionType, FlowChartNode } from '../../types/flowChart';
import { SelectionMetric, ShortcutRow } from './WorkspaceBits';
import type { WorkspaceNodeType, WorkspaceTheme } from './types';

interface EditorSidebarProps {
  errorMessage: string;
  aiDescription: string;
  onAiDescriptionChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  aiTextareaRef: Ref<HTMLTextAreaElement>;
  nodeTypes: WorkspaceNodeType[];
  addNodeFromPalette: (type: WorkspaceNodeType['type']) => void;
  selectedNodeData: FlowChartNode | null;
  selectedNodeCount: number;
  hasLockedSelection: boolean;
  allSelectedNodesLocked: boolean;
  selectedConnectionData: Connection | null;
  selectedConnectionEndpoints: {
    from: FlowChartNode | null;
    to: FlowChartNode | null;
  } | null;
  updateNodeText: (text: string) => void;
  updateNodeType: (type: FlowChartNode['type']) => void;
  updateNodeStyle: (style: Partial<NonNullable<FlowChartNode['style']>>) => void;
  onSetSelectionLocked: (locked: boolean) => void;
  onSaveNodeStyleAsDefault: () => void;
  onDeleteSelectedNode: () => void;
  onDeleteSelectedNodes: () => void;
  onDeleteSelectedConnection: () => void;
  updateConnectionLabel: (label: string) => void;
  updateConnectionType: (type: ConnectionType) => void;
  updateConnectionMarker: (side: 'startMarker' | 'endMarker', marker: ConnectionMarker) => void;
  updateConnectionColor: (color: string) => void;
  updateConnectionAnimated: (animated: boolean) => void;
  onResetConnectionRoute: () => void;
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
  onGenerate,
  isGenerating,
  aiTextareaRef,
  nodeTypes,
  addNodeFromPalette,
  selectedNodeData,
  selectedNodeCount,
  hasLockedSelection,
  allSelectedNodesLocked,
  selectedConnectionData,
  selectedConnectionEndpoints,
  updateNodeText,
  updateNodeType,
  updateNodeStyle,
  onSetSelectionLocked,
  onSaveNodeStyleAsDefault,
  onDeleteSelectedNode,
  onDeleteSelectedNodes,
  onDeleteSelectedConnection,
  updateConnectionLabel,
  updateConnectionType,
  updateConnectionMarker,
  updateConnectionColor,
  updateConnectionAnimated,
  onResetConnectionRoute,
  onImport,
  onExportJson,
  onExportPng,
  onExportSvg,
  onExportPdf,
  onClearBoard,
  workspaceTheme,
  onClose
}: EditorSidebarProps) {
  const isDark = workspaceTheme === 'dark';
  const isNodeLocked = Boolean(selectedNodeData?.locked);
  const hasManualConnectionRoute = Boolean(selectedConnectionData?.waypoints?.length);
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

  return (
    <aside className={`w-full shrink-0 xl:flex xl:h-full xl:w-[360px] xl:min-h-0 xl:border-l ${asideClass}`}>
      <div className="space-y-4 p-4 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pr-3">
        <div className="flex items-center justify-between">
          <h2 className={`font-bold text-lg ${sectionTitleClass}`}>Properties</h2>
          <button onClick={onClose} className={`rounded-full p-2 transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`} title="Hide inspector">
            <ChevronRight className={`h-5 w-5 ${sectionKickerClass}`} />
          </button>
        </div>
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
              <p className={`text-xs font-semibold uppercase tracking-[0.24em] flex items-center gap-2 ${sectionKickerClass}`}>
                AI Composer
                <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600 tracking-normal">Coming Soon</span>
              </p>
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
            disabled={true}
            placeholder="AI is currently in development..."
            className={`min-h-[112px] w-full rounded-[20px] border px-4 py-3 text-sm leading-6 outline-none transition opacity-50 cursor-not-allowed ${fieldClass}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onGenerate();
              }
            }}
          />

          <button
            onClick={onGenerate}
            disabled={true}
            className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[20px] px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all duration-200 bg-orange-400 opacity-50 cursor-not-allowed`}
          >
            {isGenerating ? <Loader className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            {isGenerating ? 'Generating...' : 'Coming Soon'}
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
              <div className={`inline-flex items-center gap-2 rounded-[18px] border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                isNodeLocked
                  ? isDark
                    ? 'border-amber-400/25 bg-amber-500/10 text-amber-200'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                  : isDark
                    ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}>
                {isNodeLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                {isNodeLocked ? 'Locked node' : 'Editable node'}
              </div>

              <div className={`rounded-[20px] border p-4 ${softCardClass}`}>
                <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.22em] ${sectionKickerClass}`}>
                  Node label
                </label>
                <input
                  value={selectedNodeData.text}
                  onChange={(e) => updateNodeText(e.target.value)}
                  disabled={isNodeLocked}
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
                    disabled={isNodeLocked}
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
                    disabled={isNodeLocked}
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
                  disabled={isNodeLocked}
                />
                <ColorField
                  label="Border Color"
                  value={selectedNodeData.style?.borderColor ?? '#cbd5e1'}
                  onChange={(value) => updateNodeStyle({ borderColor: value })}
                  workspaceTheme={workspaceTheme}
                  disabled={isNodeLocked}
                />
                <ColorField
                  label="Text Color"
                  value={selectedNodeData.style?.textColor ?? '#0f172a'}
                  onChange={(value) => updateNodeStyle({ textColor: value })}
                  workspaceTheme={workspaceTheme}
                  disabled={isNodeLocked}
                />

                <label className={`text-xs font-semibold uppercase tracking-[0.22em] ${sectionKickerClass}`}>
                  Font Size
                  <input
                    type="number"
                    min={10}
                    max={24}
                    value={selectedNodeData.style?.fontSize ?? 12}
                    onChange={(e) => updateNodeStyle({ fontSize: Number(e.target.value) || 12 })}
                    disabled={isNodeLocked}
                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm font-medium outline-none ${
                      isDark ? 'border-white/10 bg-[#0f1116] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  />
                </label>

                <label className={`text-xs font-semibold uppercase tracking-[0.22em] ${sectionKickerClass}`}>
                  Rotation
                  <select
                    value={selectedNodeData.style?.rotation ?? 0}
                    onChange={(e) =>
                      updateNodeStyle({ rotation: Number(e.target.value) as 0 | 90 | 180 | 270 })
                    }
                    disabled={isNodeLocked}
                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm font-medium outline-none ${
                      isDark ? 'border-white/10 bg-[#0f1116] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  >
                    <option value={0}>0°</option>
                    <option value={90}>90°</option>
                    <option value={180}>180°</option>
                    <option value={270}>270°</option>
                  </select>
                </label>
              </div>

              <button
                onClick={() => onSetSelectionLocked(!isNodeLocked)}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-[20px] border px-4 py-3 text-sm font-semibold transition ${
                  isNodeLocked
                    ? isDark
                      ? 'border-amber-400/25 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15'
                      : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : isDark
                      ? 'border-white/10 bg-white/[0.04] text-slate-100 hover:border-white/20 hover:bg-white/[0.08]'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {isNodeLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {isNodeLocked ? 'Unlock selected node' : 'Lock selected node'}
              </button>

              <button
                onClick={onSaveNodeStyleAsDefault}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-[20px] border px-4 py-3 text-sm font-semibold transition ${
                  isDark
                    ? 'border-white/10 bg-white/[0.04] text-slate-100 hover:border-white/20 hover:bg-white/[0.08]'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                Save as default for {selectedNodeData.type}
              </button>

              <button
                onClick={onDeleteSelectedNode}
                disabled={isNodeLocked}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Trash2 className="h-4 w-4" />
                Delete selected node
              </button>
            </div>
          ) : selectedNodeCount > 1 ? (
            <div className="space-y-4">
              <div className={`rounded-[20px] border p-4 text-sm ${softCardClass} ${softTextClass}`}>
                <p className={`font-medium ${softStrongTextClass}`}>{selectedNodeCount} nodes selected</p>
                <p className="mt-2">
                  {hasLockedSelection
                    ? 'Unlock the locked nodes before aligning, grouping, or tidying the full selection.'
                    : 'Drag them together, use the floating toolbar to align or tidy, or duplicate with `Ctrl/Cmd + D`.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onSetSelectionLocked(true)}
                  disabled={allSelectedNodesLocked}
                  className={`inline-flex items-center justify-center gap-2 rounded-[20px] border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                    isDark
                      ? 'border-white/10 bg-white/[0.04] text-slate-100 hover:border-white/20 hover:bg-white/[0.08]'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Lock className="h-4 w-4" />
                  Lock selection
                </button>
                <button
                  onClick={() => onSetSelectionLocked(false)}
                  disabled={!hasLockedSelection}
                  className={`inline-flex items-center justify-center gap-2 rounded-[20px] border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                    isDark
                      ? 'border-white/10 bg-white/[0.04] text-slate-100 hover:border-white/20 hover:bg-white/[0.08]'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Unlock className="h-4 w-4" />
                  Unlock selection
                </button>
              </div>

              <button
                onClick={onDeleteSelectedNodes}
                disabled={allSelectedNodesLocked}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-45"
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
                <p className={`mt-2 ${sectionCopyClass}`}>
                  Drag the bend handle on the selected line to reroute it around nearby blocks.
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

              <label className={`flex items-center gap-3 rounded-[20px] border p-4 cursor-pointer transition ${softCardClass}`}>
                <input
                  type="checkbox"
                  checked={selectedConnectionData.animated ?? false}
                  onChange={(e) => updateConnectionAnimated(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                />
                <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Animated Flow
                </span>
              </label>

              <button
                onClick={onResetConnectionRoute}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-[20px] border px-4 py-3 text-sm font-semibold transition ${
                  hasManualConnectionRoute
                    ? isDark
                      ? 'border-sky-400/25 bg-sky-500/10 text-sky-100 hover:bg-sky-500/15'
                      : 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
                    : isDark
                      ? 'border-white/10 bg-white/[0.04] text-slate-100 hover:border-white/20 hover:bg-white/[0.08]'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Circle className="h-4 w-4" />
                {hasManualConnectionRoute ? 'Reset to auto route' : 'Auto route active'}
              </button>

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
            <ShortcutRow action="Alt + click grouped node" result="Deep-select one node inside a group" theme={workspaceTheme} />
            <ShortcutRow action="R / D / O / L / T" result="Drop process, decision, connector, note, or triangle fast" theme={workspaceTheme} />
            <ShortcutRow action="Cmd/Ctrl + C / V / D" result="Copy, paste, or duplicate selection" theme={workspaceTheme} />
            <ShortcutRow action="Ctrl/Cmd + wheel" result="Zoom the workspace like a canvas tool" theme={workspaceTheme} />
            <ShortcutRow action="Alt + Arrow key" result="Create a connected step from the selected node" theme={workspaceTheme} />
            <ShortcutRow action="F" result="Fit the current selection" theme={workspaceTheme} />
            <ShortcutRow action="G / Shift + G" result="Group or ungroup a multi-selection" theme={workspaceTheme} />
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
  workspaceTheme,
  disabled = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  workspaceTheme: WorkspaceTheme;
  disabled?: boolean;
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
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-8 w-10 rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-45"
        />
        <span className={`text-sm font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'} ${disabled ? 'opacity-45' : ''}`}>{value}</span>
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
