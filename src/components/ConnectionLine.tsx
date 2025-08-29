import React from 'react';
import { Connection, FlowChartNode } from '../types/flowChart';

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
  const getConnectionPoint = (node: FlowChartNode, side: 'top' | 'right' | 'bottom' | 'left') => {
    const { x, y, width, height } = node.position ? 
      { ...node.position, width: node.width, height: node.height } : 
      { x: 0, y: 0, width: node.width, height: node.height };

    switch (side) {
      case 'top': return { x: x + width / 2, y };
      case 'right': return { x: x + width, y: y + height / 2 };
      case 'bottom': return { x: x + width / 2, y: y + height };
      case 'left': return { x, y: y + height / 2 };
      default: return { x: x + width / 2, y: y + height };
    }
  };

  const fromPoint = getConnectionPoint(fromNode, connection.fromSide);
  const toPoint = getConnectionPoint(toNode, connection.toSide);

  // Calculate smooth curve path
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const controlOffset = Math.min(distance / 3, 80);

  let path = '';
  
  // Create smooth curves based on connection direction
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
    // Default smooth curve
    const midX = (fromPoint.x + toPoint.x) / 2;
    const midY = (fromPoint.y + toPoint.y) / 2;
    path = `M ${fromPoint.x} ${fromPoint.y} 
            Q ${midX} ${midY} 
              ${toPoint.x} ${toPoint.y}`;
  }

  // Calculate midpoint for label and delete button
  const midPoint = {
    x: (fromPoint.x + toPoint.x) / 2,
    y: (fromPoint.y + toPoint.y) / 2
  };

  // Calculate arrow position (closer to target)
  const arrowOffset = 0.85;
  const arrowPoint = {
    x: fromPoint.x + (toPoint.x - fromPoint.x) * arrowOffset,
    y: fromPoint.y + (toPoint.y - fromPoint.y) * arrowOffset
  };

  return (
    <g className="connection-group">
      {/* Invisible thick line for easier clicking */}
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
      
      {/* Visible connection path */}
      <path
        d={path}
        stroke={isSelected ? '#3B82F6' : '#6B7280'}
        strokeWidth={isSelected ? 3 : 2}
        fill="none"
        className="pointer-events-none transition-all duration-200"
        markerEnd="url(#arrowhead)"
      />
      
      {/* Arrow marker */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon 
            points="0 0, 10 3.5, 0 7" 
            fill={isSelected ? '#3B82F6' : '#6B7280'}
            className="transition-colors duration-200"
          />
        </marker>
      </defs>

      {/* Connection label */}
      {connection.label && (
        <g>
          <rect
            x={midPoint.x - 20}
            y={midPoint.y - 10}
            width="40"
            height="20"
            rx="4"
            fill="white"
            stroke="#E5E7EB"
            className="pointer-events-none"
          />
          <text
            x={midPoint.x}
            y={midPoint.y + 3}
            textAnchor="middle"
            className="fill-gray-700 text-xs font-medium pointer-events-none"
          >
            {connection.label}
          </text>
        </g>
      )}

      {/* Delete button for selected connection */}
      {isSelected && (
        <g className="pointer-events-auto">
          <circle
            cx={midPoint.x}
            cy={midPoint.y}
            r="10"
            className="fill-red-500 cursor-pointer hover:fill-red-600 transition-colors duration-200"
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
            ×
          </text>
        </g>
      )}
    </g>
  );
}