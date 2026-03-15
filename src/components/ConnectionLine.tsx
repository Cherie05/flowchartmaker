import { useId } from 'react';
import type { Connection, FlowChartNode } from '../types/flowChart';

interface ConnectionLineProps {
  connection: Connection;
  fromNode: FlowChartNode;
  toNode: FlowChartNode;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function ConnectionLine({
  connection,
  fromNode,
  toNode,
  isSelected,
  onSelect,
  onDelete
}: ConnectionLineProps) {
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

  let path = '';

  if (connection.fromSide === 'bottom' && connection.toSide === 'top') {
    path = `M ${fromPoint.x} ${fromPoint.y}
            C ${fromPoint.x} ${fromPoint.y + controlOffset}
              ${toPoint.x} ${toPoint.y - controlOffset}
              ${toPoint.x} ${toPoint.y}`;
  } else if (connection.fromSide === 'right' && connection.toSide === 'left') {
    path = `M ${fromPoint.x} ${fromPoint.y}
            C ${fromPoint.x + controlOffset} ${fromPoint.y}
              ${toPoint.x - controlOffset} ${toPoint.y}
              ${toPoint.x} ${toPoint.y}`;
  } else if (connection.fromSide === 'left' && connection.toSide === 'right') {
    path = `M ${fromPoint.x} ${fromPoint.y}
            C ${fromPoint.x - controlOffset} ${fromPoint.y}
              ${toPoint.x + controlOffset} ${toPoint.y}
              ${toPoint.x} ${toPoint.y}`;
  } else {
    const midX = (fromPoint.x + toPoint.x) / 2;
    const midY = (fromPoint.y + toPoint.y) / 2;
    path = `M ${fromPoint.x} ${fromPoint.y}
            Q ${midX} ${midY}
              ${toPoint.x} ${toPoint.y}`;
  }

  const midPoint = {
    x: (fromPoint.x + toPoint.x) / 2,
    y: (fromPoint.y + toPoint.y) / 2
  };
  const labelWidth = connection.label ? Math.max(58, connection.label.length * 6.5 + 24) : 0;
  const lineColor = isSelected ? '#f97316' : '#94a3b8';
  const labelBorder = isSelected ? '#fdba74' : '#e7e5e4';

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
        stroke="rgba(255,255,255,0.92)"
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
        markerEnd={`url(#${markerId})`}
      />

      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
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
            fill="#fffaf0"
            stroke={labelBorder}
            className="pointer-events-none"
          />
          <text
            x={midPoint.x}
            y={midPoint.y + 3}
            textAnchor="middle"
            className="fill-slate-700 text-xs font-medium pointer-events-none"
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
            className="cursor-pointer fill-slate-900 transition-colors duration-200 hover:fill-rose-500"
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
