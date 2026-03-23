import { Copy, GitBranch, Plus, Route, Trash2 } from 'lucide-react';
import type { ConnectionMarker, ConnectionType, FlowChartNode } from '../../types/flowChart';
import type { WorkspaceNodeType, WorkspaceTheme } from './types';

type NodeToolbarProps = {
  mode: 'node';
  nodeType: FlowChartNode['type'];
  nodeTypes: WorkspaceNodeType[];
  onNodeTypeChange: (type: FlowChartNode['type']) => void;
  onQuickCreateRight: () => void;
  onQuickCreateDown: () => void;
  onOpenQuickAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

type ConnectionToolbarProps = {
  mode: 'connection';
  connectionType: ConnectionType;
  startMarker: ConnectionMarker;
  endMarker: ConnectionMarker;
  onConnectionTypeChange: (type: ConnectionType) => void;
  onToggleMarker: (side: 'startMarker' | 'endMarker') => void;
  onAddLabel: () => void;
  onOpenQuickAdd: () => void;
  onDelete: () => void;
};

type SelectionContextBarProps = {
  isVisible: boolean;
  x: number;
  y: number;
  workspaceTheme: WorkspaceTheme;
} & (NodeToolbarProps | ConnectionToolbarProps);

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
        top: y,
        transform: 'translate(-50%, -120%)'
      }}
    >
      <div className={`flex items-center gap-2 rounded-[22px] border p-2 backdrop-blur-xl ${shellClass}`}>
        {props.mode === 'node' ? (
          <>
            <select
              value={props.nodeType}
              onChange={(e) => props.onNodeTypeChange(e.target.value as FlowChartNode['type'])}
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
            <ToolbarButton icon={Plus} label="Next" onClick={props.onQuickCreateRight} className={buttonClass} />
            <ToolbarButton icon={GitBranch} label="Below" onClick={props.onQuickCreateDown} className={buttonClass} />
            <ToolbarButton icon={Route} label="Picker" onClick={props.onOpenQuickAdd} className={buttonClass} />
            <ToolbarButton icon={Copy} label="Duplicate" onClick={props.onDuplicate} className={buttonClass} />
            <ToolbarButton icon={Trash2} label="Delete" onClick={props.onDelete} className={buttonClass} />
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
            <ToolbarButton icon={Plus} label="Add block" onClick={props.onOpenQuickAdd} className={buttonClass} />
            <ToolbarButton icon={Trash2} label="Delete" onClick={props.onDelete} className={buttonClass} />
          </>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  className
}: {
  icon: typeof Plus;
  label: string;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${className}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
