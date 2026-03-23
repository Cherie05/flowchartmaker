import { useId } from 'react';
import type { WorkspaceTheme } from './editor/types';
import type { Connection, FlowChartNode } from '../types/flowChart';

interface ConnectionLineProps {
  connection: Connection;
  fromNode: FlowChartNode;
  toNode: FlowChartNode;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  workspaceTheme: WorkspaceTheme;
}

export function ConnectionLine({
  connection,
  fromNode,
  toNode,
  isSelected,
  onSelect,
  onDelete,
  workspaceTheme
}: ConnectionLineProps) {
  const isDark = workspaceTheme === 'dark';
  const markerId = useId().replace(/:/g, '-');

  const getConnectionPoint = (node: FlowChartNode, side: Connection['fromSide']) => {
    const { x, y, width, height } = node.position
      ? { ...node.position, width: node.width, height: node.height }
      : { x: 0, y: 0, width: node.width, height: node.height };

    switch (side) {
      case 'top':
        return { x: x + width / 2, y };
      case 'right':
        return { x: x + width, y: y + height / 2 };
      case 'bottom':
        return { x: x + width / 2, y: y + height };
      case 'left':
        return { x, y: y + height / 2 };
      default:
        return { x: x + width / 2, y: y + height };
    }
  };

  const fromPoint = getConnectionPoint(fromNode, connection.fromSide);
  const toPoint = getConnectionPoint(toNode, connection.toSide);
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const controlOffset = Math.min(distance / 3, 80);

  const connectionType = connection.type ?? 'curved';
  const path =
    connectionType === 'straight'
      ? `M ${fromPoint.x} ${fromPoint.y} L ${toPoint.x} ${toPoint.y}`
      : connectionType === 'elbow'
        ? buildElbowPath(fromPoint, toPoint, connection)
        : buildCurvedPath(fromPoint, toPoint, connection, controlOffset);

  const midPoint = {
    x: (fromPoint.x + toPoint.x) / 2,
    y: (fromPoint.y + toPoint.y) / 2
  };
  const labelWidth = connection.label ? Math.max(58, connection.label.length * 6.5 + 24) : 0;
  const lineColor = connection.color ?? (isSelected ? '#38bdf8' : isDark ? '#cbd5e1' : '#64748b');
  const underlayColor = isDark ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.92)';
  const labelFill = isDark ? '#16181d' : '#ffffff';
  const labelBorder = isSelected ? 'rgba(56, 189, 248, 0.4)' : isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(148, 163, 184, 0.35)';
  const labelTextClass = isDark ? 'fill-slate-200' : 'fill-slate-700';
  const deleteFillClass = isDark ? 'fill-slate-900' : 'fill-slate-700';
  const markerStart = connection.startMarker === 'arrow' ? `url(#${markerId})` : undefined;
  const markerEnd = (connection.endMarker ?? 'arrow') === 'arrow' ? `url(#${markerId})` : undefined;

  return (
    <g className="connection-group">
      <path
        d={path}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
        className="cursor-pointer pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      />

      <path
        d={path}
        stroke={underlayColor}
        strokeWidth={isSelected ? 6 : 5}
        fill="none"
        strokeLinecap="round"
        className="pointer-events-none"
      />

      <path
        d={path}
        stroke={lineColor}
        strokeWidth={isSelected ? 3 : 2.25}
        fill="none"
        strokeLinecap="round"
        className="pointer-events-none transition-all duration-200"
        markerStart={markerStart}
        markerEnd={markerEnd}
      />

      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={lineColor}
            className="transition-colors duration-200"
          />
        </marker>
      </defs>

      {connection.label && (
        <g>
          <rect
            x={midPoint.x - labelWidth / 2}
            y={midPoint.y - 10}
            width={labelWidth}
            height="20"
            rx="10"
            fill={labelFill}
            stroke={labelBorder}
            className="pointer-events-none"
          />
          <text
            x={midPoint.x}
            y={midPoint.y + 3}
            textAnchor="middle"
            className={`${labelTextClass} text-xs font-medium pointer-events-none`}
          >
            {connection.label}
          </text>
        </g>
      )}

      {isSelected && (
        <g className="pointer-events-auto">
          <circle
            cx={midPoint.x}
            cy={midPoint.y}
            r="10"
            className={`cursor-pointer transition-colors duration-200 hover:fill-rose-500 ${deleteFillClass}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          />
          <text
            x={midPoint.x}
            y={midPoint.y + 3}
            textAnchor="middle"
            className="fill-white text-xs font-bold pointer-events-none"
          >
            x
          </text>
        </g>
      )}
    </g>
  );
}

function buildCurvedPath(
  fromPoint: { x: number; y: number },
  toPoint: { x: number; y: number },
  connection: Connection,
  controlOffset: number
): string {
  const fromVector = getSideVector(connection.fromSide);
  const toVector = getSideVector(connection.toSide);
  const bendOffset = Math.max(44, Math.min(120, controlOffset));
  const ctrl1 = {
    x: fromPoint.x + fromVector.x * bendOffset,
    y: fromPoint.y + fromVector.y * bendOffset
  };
  const ctrl2 = {
    x: toPoint.x + toVector.x * bendOffset,
    y: toPoint.y + toVector.y * bendOffset
  };

  if (
    Math.abs(fromPoint.y - toPoint.y) < 24 &&
    ((connection.fromSide === 'right' && connection.toSide === 'left') ||
      (connection.fromSide === 'left' && connection.toSide === 'right'))
  ) {
    const arch = fromPoint.x <= toPoint.x ? -bendOffset * 0.7 : bendOffset * 0.7;
    ctrl1.y += arch;
    ctrl2.y += arch;
  }

  if (
    Math.abs(fromPoint.x - toPoint.x) < 24 &&
    ((connection.fromSide === 'bottom' && connection.toSide === 'top') ||
      (connection.fromSide === 'top' && connection.toSide === 'bottom'))
  ) {
    const arch = fromPoint.y <= toPoint.y ? bendOffset * 0.7 : -bendOffset * 0.7;
    ctrl1.x += arch;
    ctrl2.x += arch;
  }

  return `M ${fromPoint.x} ${fromPoint.y}
          C ${ctrl1.x} ${ctrl1.y}
            ${ctrl2.x} ${ctrl2.y}
            ${toPoint.x} ${toPoint.y}`;
}

function buildElbowPath(
  fromPoint: { x: number; y: number },
  toPoint: { x: number; y: number },
  connection: Connection
): string {
  if (connection.fromSide === 'left' || connection.fromSide === 'right') {
    const midX = fromPoint.x + (toPoint.x - fromPoint.x) / 2;
    return `M ${fromPoint.x} ${fromPoint.y}
            L ${midX} ${fromPoint.y}
            L ${midX} ${toPoint.y}
            L ${toPoint.x} ${toPoint.y}`;
  }

  const midY = fromPoint.y + (toPoint.y - fromPoint.y) / 2;

  return `M ${fromPoint.x} ${fromPoint.y}
          L ${fromPoint.x} ${midY}
          L ${toPoint.x} ${midY}
          L ${toPoint.x} ${toPoint.y}`;
}

function getSideVector(side: Connection['fromSide']) {
  switch (side) {
    case 'top':
      return { x: 0, y: -1 };
    case 'right':
      return { x: 1, y: 0 };
    case 'bottom':
      return { x: 0, y: 1 };
    case 'left':
      return { x: -1, y: 0 };
    default:
      return { x: 0, y: 1 };
  }
}
