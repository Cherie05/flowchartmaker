import { Copy, GitBranch, Lock, Plus, Route, Trash2, Unlock, Wand2 } from 'lucide-react';
import type { ConnectionMarker, ConnectionType, FlowChartNode } from '../../types/flowChart';
import type { WorkspaceNodeType, WorkspaceTheme } from './types';

type NodeToolbarProps = {
  mode: 'node';
  nodeType: FlowChartNode['type'];
  isLocked: boolean;
  nodeTypes: WorkspaceNodeType[];
  onNodeTypeChange: (type: FlowChartNode['type']) => void;
  onQuickCreateRight: () => void;
  onQuickCreateDown: () => void;
  onOpenQuickAdd: () => void;
  onDuplicate: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  onEditWithAi: () => void;
};

type ConnectionToolbarProps = {
  mode: 'connection';
  connectionType: ConnectionType;
  startMarker: ConnectionMarker;
  endMarker: ConnectionMarker;
  onConnectionTypeChange: (type: ConnectionType) => void;
  onToggleMarker: (side: 'startMarker' | 'endMarker') => void;
  onAddLabel: () => void;
  onResetRoute: () => void;
  hasManualRoute: boolean;
  onOpenQuickAdd: () => void;
  onDelete: () => void;
};

type MultiToolbarProps = {
  mode: 'multi';
  canUngroup: boolean;
  hasLockedNodes: boolean;
  allLocked: boolean;
  onAlignLeft: () => void;
  onAlignTop: () => void;
  onDistributeHorizontal: () => void;
  onDistributeVertical: () => void;
  onTidy: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onLock: () => void;
  onUnlock: () => void;
  onEditWithAi: () => void;
};

type SelectionContextBarProps = {
  isVisible: boolean;
  x: number;
  y: number;
  workspaceTheme: WorkspaceTheme;
} & (NodeToolbarProps | ConnectionToolbarProps | MultiToolbarProps);

export function SelectionContextBar(props: SelectionContextBarProps) {
  const { isVisible, x, y, workspaceTheme } = props;

  if (!isVisible) {
    return null;
  }

  const isDark = workspaceTheme === 'dark';
  const shellClass = isDark
    ? 'border-white/10 bg-[#17191d]/96 shadow-black/40'
    : 'border-white/90 bg-white/96 shadow-[0_22px_70px_-46px_rgba(15,23,42,0.45)]';
  const buttonClass = isDark
    ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:bg-white/[0.08]'
    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50';
  const activeClass = isDark
    ? 'border-sky-400/30 bg-sky-500/15 text-sky-100'
    : 'border-sky-300 bg-sky-50 text-sky-700';

  return (
    <div
      className="absolute z-[60]"
      style={{
        left: x,
        top: Math.max(y, 70),
        transform: 'translate(-50%, -120%)'
      }}
    >
      <div className={`flex items-center gap-2 rounded-[22px] border p-2 backdrop-blur-xl ${shellClass}`}>
        {props.mode === 'node' ? (
          <>
            <select
              value={props.nodeType}
              onChange={(e) => props.onNodeTypeChange(e.target.value as FlowChartNode['type'])}
              disabled={props.isLocked}
              className={`rounded-xl border px-3 py-2 text-sm font-medium outline-none ${
                isDark ? 'border-white/10 bg-[#101218] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
              }`}
              title="Change shape"
            >
              {props.nodeTypes.map((nodeType) => (
                <option key={nodeType.type} value={nodeType.type}>
                  {nodeType.label}
                </option>
              ))}
            </select>
            <ToolbarButton icon={Plus} label="Next" onClick={props.onQuickCreateRight} className={buttonClass} disabled={props.isLocked} />
            <ToolbarButton icon={GitBranch} label="Branch" onClick={props.onQuickCreateDown} className={buttonClass} disabled={props.isLocked} />
            <ToolbarButton icon={Route} label="Add block" onClick={props.onOpenQuickAdd} className={buttonClass} disabled={props.isLocked} />
            <ToolbarButton icon={Copy} label="Duplicate" onClick={props.onDuplicate} className={buttonClass} />
            <ToolbarButton icon={Wand2} label="Edit with AI" onClick={props.onEditWithAi} className={buttonClass} disabled={props.isLocked} />
            <ToolbarButton
              icon={props.isLocked ? Unlock : Lock}
              label={props.isLocked ? 'Unlock' : 'Lock'}
              onClick={props.onToggleLock}
              className={props.isLocked ? activeClass : buttonClass}
            />
            <ToolbarButton icon={Trash2} label="Delete" onClick={props.onDelete} className={buttonClass} disabled={props.isLocked} />
          </>
        ) : (
          props.mode === 'multi' ? (
            <>
              <ToolbarButton icon={Route} label="Align left" onClick={props.onAlignLeft} className={buttonClass} disabled={props.hasLockedNodes} />
              <ToolbarButton icon={Route} label="Align top" onClick={props.onAlignTop} className={buttonClass} disabled={props.hasLockedNodes} />
              <ToolbarButton icon={Route} label="Distribute H" onClick={props.onDistributeHorizontal} className={buttonClass} disabled={props.hasLockedNodes} />
              <ToolbarButton icon={Route} label="Distribute V" onClick={props.onDistributeVertical} className={buttonClass} disabled={props.hasLockedNodes} />
              <ToolbarButton icon={GitBranch} label="Tidy" onClick={props.onTidy} className={buttonClass} disabled={props.hasLockedNodes} />
              <ToolbarButton icon={Wand2} label="Edit with AI" onClick={props.onEditWithAi} className={buttonClass} disabled={props.hasLockedNodes} />
              <ToolbarButton icon={Copy} label="Group" onClick={props.onGroup} className={buttonClass} disabled={props.hasLockedNodes} />
              <ToolbarButton
                icon={Copy}
                label="Ungroup"
                onClick={props.onUngroup}
                className={props.canUngroup ? activeClass : buttonClass}
                disabled={!props.canUngroup || props.hasLockedNodes}
              />
              <ToolbarButton icon={Plus} label="Front" onClick={props.onBringForward} className={buttonClass} disabled={props.hasLockedNodes} />
              <ToolbarButton icon={Plus} label="Back" onClick={props.onSendBackward} className={buttonClass} disabled={props.hasLockedNodes} />
              <ToolbarButton icon={Lock} label="Lock" onClick={props.onLock} className={buttonClass} disabled={props.allLocked} />
              <ToolbarButton
                icon={Unlock}
                label="Unlock"
                onClick={props.onUnlock}
                className={props.hasLockedNodes ? activeClass : buttonClass}
                disabled={!props.hasLockedNodes}
              />
            </>
          ) : (
          <>
            {(['curved', 'elbow', 'straight'] as const).map((type) => (
              <ToolbarButton
                key={type}
                icon={Route}
                label={type === 'curved' ? 'Curve' : type === 'elbow' ? 'Elbow' : 'Straight'}
                onClick={() => props.onConnectionTypeChange(type)}
                className={props.connectionType === type ? activeClass : buttonClass}
              />
            ))}
            <ToolbarButton
              icon={Route}
              label={props.startMarker === 'arrow' ? 'Start arrow' : 'Start none'}
              onClick={() => props.onToggleMarker('startMarker')}
              className={props.startMarker === 'arrow' ? activeClass : buttonClass}
            />
            <ToolbarButton
              icon={Route}
              label={props.endMarker === 'arrow' ? 'End arrow' : 'End none'}
              onClick={() => props.onToggleMarker('endMarker')}
              className={props.endMarker === 'arrow' ? activeClass : buttonClass}
            />
            <ToolbarButton icon={Plus} label="Label" onClick={props.onAddLabel} className={buttonClass} />
            <ToolbarButton
              icon={Route}
              label="Auto route"
              onClick={props.onResetRoute}
              className={props.hasManualRoute ? activeClass : buttonClass}
            />
            <ToolbarButton icon={Plus} label="Add block" onClick={props.onOpenQuickAdd} className={buttonClass} />
            <ToolbarButton icon={Trash2} label="Delete" onClick={props.onDelete} className={buttonClass} />
          </>
          )
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  className,
  disabled = false
}: {
  icon: typeof Plus;
  label: string;
  onClick: () => void;
  className: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
