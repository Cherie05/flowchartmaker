import { useId, useState, type MouseEvent as ReactMouseEvent } from 'react';
import type { WorkspaceTheme } from './editor/types';
import { buildConnectionGeometry, getConnectionPoint } from '../lib/connectionRouting';
import type { Connection, FlowChartNode, Position } from '../types/flowChart';

interface ConnectionLineProps {
  connection: Connection;
  fromNode: FlowChartNode;
  toNode: FlowChartNode;
  obstacleNodes: FlowChartNode[];
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onLabelPositionChange: (position: number) => void;
  onLabelChange: (label: string) => void;
  onWaypointsChange: (waypoints: Position[] | undefined) => void;
  workspaceTheme: WorkspaceTheme;
}

export function ConnectionLine({
  connection,
  fromNode,
  toNode,
  obstacleNodes,
  isSelected,
  onSelect,
  onDelete,
  onLabelPositionChange,
  onLabelChange,
  onWaypointsChange,
  workspaceTheme
}: ConnectionLineProps) {
  const isDark = workspaceTheme === 'dark';
  const markerId = useId().replace(/:/g, '-');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(connection.label ?? '');

  const fromPoint = getConnectionPoint(fromNode, connection.fromSide);
  const toPoint = getConnectionPoint(toNode, connection.toSide);
  const connectionType = connection.type ?? 'curved';
  const geometry = buildConnectionGeometry({
    connection,
    fromNode,
    toNode,
    obstacleNodes
  });
  const path = geometry.path;
  const labelPoint = geometry.labelPoint;
  const deletePoint =
    geometry.bendHandlePoint && Math.hypot(geometry.bendHandlePoint.x - labelPoint.x, geometry.bendHandlePoint.y - labelPoint.y) < 18
      ? { x: labelPoint.x + 18, y: labelPoint.y - 18 }
      : labelPoint;
  const labelWidth = connection.label ? Math.max(58, connection.label.length * 6.5 + 24) : 0;
  const lineColor = connection.color ?? (isSelected ? '#38bdf8' : isDark ? '#cbd5e1' : '#64748b');
  const underlayColor = isDark ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.92)';
  const labelFill = isDark ? '#16181d' : '#ffffff';
  const labelBorder = isSelected ? 'rgba(56, 189, 248, 0.4)' : isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(148, 163, 184, 0.35)';
  const labelTextClass = isDark ? 'fill-slate-200' : 'fill-slate-700';
  const deleteFillClass = isDark ? 'fill-slate-900' : 'fill-slate-700';
  const bendHandleFill = isDark ? '#111827' : '#ffffff';
  const bendHandleStroke = isSelected ? '#38bdf8' : isDark ? '#cbd5e1' : '#64748b';
  const markerStart = connection.startMarker === 'arrow' ? `url(#${markerId})` : undefined;
  const markerEnd = (connection.endMarker ?? 'arrow') === 'arrow' ? `url(#${markerId})` : undefined;

  const handleLabelDrag = (event: ReactMouseEvent<SVGGElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect();

    const svgRect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!svgRect) {
      return;
    }

    const start = fromPoint;
    const end = toPoint;
    const vector = { x: end.x - start.x, y: end.y - start.y };
    const lengthSquared = vector.x * vector.x + vector.y * vector.y;

    const updatePosition = (moveEvent: MouseEvent) => {
      if (!lengthSquared) {
        return;
      }

      const pointer = {
        x: moveEvent.clientX - svgRect.left,
        y: moveEvent.clientY - svgRect.top
      };
      const projection =
        ((pointer.x - start.x) * vector.x + (pointer.y - start.y) * vector.y) / lengthSquared;
      onLabelPositionChange(Math.max(0.12, Math.min(0.88, projection)));
    };

    const stopDragging = () => {
      document.removeEventListener('mousemove', updatePosition);
      document.removeEventListener('mouseup', stopDragging);
    };

    document.addEventListener('mousemove', updatePosition);
    document.addEventListener('mouseup', stopDragging);
  };

  // Drag an existing waypoint by index
  const handleWaypointDrag = (event: ReactMouseEvent<SVGCircleElement>, waypointIndex: number) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect();

    const svgRect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!svgRect) return;

    const currentWaypoints = connection.waypoints ? [...connection.waypoints] : [];

    const updateWaypoint = (moveEvent: MouseEvent) => {
      const updated = [...currentWaypoints];
      updated[waypointIndex] = {
        x: snapToGrid(moveEvent.clientX - svgRect.left),
        y: snapToGrid(moveEvent.clientY - svgRect.top)
      };
      // Keep currentWaypoints in sync for next move
      currentWaypoints[waypointIndex] = updated[waypointIndex];
      onWaypointsChange(updated);
    };

    const stopDragging = () => {
      document.removeEventListener('mousemove', updateWaypoint);
      document.removeEventListener('mouseup', stopDragging);
    };

    document.addEventListener('mousemove', updateWaypoint);
    document.addEventListener('mouseup', stopDragging);
  };

  // Delete a waypoint by double-clicking it
  const handleWaypointDelete = (waypointIndex: number) => {
    const currentWaypoints = connection.waypoints ? [...connection.waypoints] : [];
    currentWaypoints.splice(waypointIndex, 1);
    onWaypointsChange(currentWaypoints.length > 0 ? currentWaypoints : undefined);
  };

  // Insert a new waypoint by dragging a segment midpoint handle
  const handleSegmentMidpointDrag = (event: ReactMouseEvent<SVGCircleElement>, insertIndex: number) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect();

    const svgRect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!svgRect) return;

    const currentWaypoints = connection.waypoints ? [...connection.waypoints] : [];
    // Insert a placeholder at the insertIndex
    const newPoint = {
      x: snapToGrid(event.clientX - svgRect.left),
      y: snapToGrid(event.clientY - svgRect.top)
    };
    currentWaypoints.splice(insertIndex, 0, newPoint);
    onWaypointsChange([...currentWaypoints]);

    const updateWaypoint = (moveEvent: MouseEvent) => {
      currentWaypoints[insertIndex] = {
        x: snapToGrid(moveEvent.clientX - svgRect.left),
        y: snapToGrid(moveEvent.clientY - svgRect.top)
      };
      onWaypointsChange([...currentWaypoints]);
    };

    const stopDragging = () => {
      document.removeEventListener('mousemove', updateWaypoint);
      document.removeEventListener('mouseup', stopDragging);
    };

    document.addEventListener('mousemove', updateWaypoint);
    document.addEventListener('mouseup', stopDragging);
  };

  // Legacy single-waypoint drag for when there are no multi-waypoints
  const handleBendHandleDrag = (event: ReactMouseEvent<SVGCircleElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect();

    const svgRect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!svgRect) return;

    const updateWaypoint = (moveEvent: MouseEvent) => {
      onWaypointsChange([
        {
          x: snapToGrid(moveEvent.clientX - svgRect.left),
          y: snapToGrid(moveEvent.clientY - svgRect.top)
        }
      ]);
    };

    const stopDragging = () => {
      document.removeEventListener('mousemove', updateWaypoint);
      document.removeEventListener('mouseup', stopDragging);
    };

    document.addEventListener('mousemove', updateWaypoint);
    document.addEventListener('mouseup', stopDragging);
  };

  // Compute segment midpoints for "add waypoint" handles
  const waypointHandles = geometry.bendHandlePoints ?? [];
  const hasMultiWaypoints = waypointHandles.length > 0;

  // Build the series of anchor points: fromPoint → waypoints → toPoint
  const allAnchorPoints = [fromPoint, ...waypointHandles, toPoint];
  const segmentMidpoints = allAnchorPoints.slice(0, -1).map((pt, i) => ({
    x: (pt.x + allAnchorPoints[i + 1].x) / 2,
    y: (pt.y + allAnchorPoints[i + 1].y) / 2
  }));

  return (
    <g className="connection-group">
      <path
        d={path}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
        className="cursor-pointer pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
          setEditValue(connection.label ?? '');
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
        strokeDasharray={connection.animated ? "12, 12" : undefined}
        className={`pointer-events-none transition-all duration-200 ${connection.animated ? 'animate-flowing' : ''}`}
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

      {isEditing ? (
        <foreignObject
          x={labelPoint.x - 75}
          y={labelPoint.y - 14}
          width={150}
          height={28}
          className="pointer-events-auto overflow-visible"
        >
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => { setIsEditing(false); onLabelChange(editValue); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') { setIsEditing(false); onLabelChange(editValue); } }}
            className={`w-full h-full text-center text-xs font-medium outline-none rounded-xl border-2 ${isDark ? 'bg-[#16181d] text-slate-200 border-sky-500' : 'bg-white text-slate-700 border-sky-400'}`}
            placeholder="Label..."
          />
        </foreignObject>
      ) : connection.label ? (
        <g 
          className={isSelected ? 'cursor-grab' : undefined} 
          onMouseDown={handleLabelDrag}
          onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditValue(connection.label ?? ''); }}
        >
          <rect
            x={labelPoint.x - labelWidth / 2}
            y={labelPoint.y - 10}
            width={labelWidth}
            height="20"
            rx="10"
            fill={labelFill}
            stroke={labelBorder}
            className={isSelected ? 'pointer-events-auto cursor-text' : 'pointer-events-none'}
          />
          <text
            x={labelPoint.x}
            y={labelPoint.y + 3}
            textAnchor="middle"
            className={`${labelTextClass} text-xs font-medium ${isSelected ? 'pointer-events-none' : 'pointer-events-none'}`}
          >
            {connection.label}
          </text>
        </g>
      ) : null}

      {/* Multi-waypoint handles: draggable circles on each waypoint */}
      {isSelected && hasMultiWaypoints && waypointHandles.map((wp, idx) => (
        <g key={`wp-${idx}`} className="pointer-events-auto">
          <circle
            cx={wp.x}
            cy={wp.y}
            r="7"
            fill={bendHandleFill}
            stroke="#38bdf8"
            strokeWidth="2"
            className="cursor-grab transition-transform duration-150 hover:scale-125"
            onMouseDown={(e) => handleWaypointDrag(e, idx)}
            onDoubleClick={(e) => { e.stopPropagation(); handleWaypointDelete(idx); }}
          />
          {/* Small index badge */}
          <text
            x={wp.x}
            y={wp.y + 3}
            textAnchor="middle"
            className="fill-sky-400 text-[8px] font-bold pointer-events-none select-none"
          >
            {idx + 1}
          </text>
        </g>
      ))}

      {/* Segment midpoint "+" handles to add new waypoints */}
      {isSelected && segmentMidpoints.map((mid, idx) => (
        <g key={`mid-${idx}`} className="pointer-events-auto">
          <circle
            cx={mid.x}
            cy={mid.y}
            r="5"
            fill={bendHandleFill}
            stroke={isDark ? '#475569' : '#94a3b8'}
            strokeWidth="1.5"
            strokeDasharray="3,2"
            className="cursor-crosshair transition-all duration-150 hover:scale-150 hover:stroke-sky-400"
            style={{ opacity: 0.7 }}
            onMouseDown={(e) => handleSegmentMidpointDrag(e, idx)}
          />
          <text
            x={mid.x}
            y={mid.y + 3}
            textAnchor="middle"
            className={`${isDark ? 'fill-slate-500' : 'fill-slate-400'} text-[8px] font-bold pointer-events-none select-none`}
          >
            +
          </text>
        </g>
      ))}

      {/* Legacy single bend handle (for curved/elbow connections without multi-waypoints) */}
      {isSelected && !hasMultiWaypoints && connectionType !== 'straight' && geometry.bendHandlePoint && (
        <g className="pointer-events-auto">
          <circle
            cx={geometry.bendHandlePoint.x}
            cy={geometry.bendHandlePoint.y}
            r="7"
            fill={bendHandleFill}
            stroke={bendHandleStroke}
            strokeWidth="2"
            className="cursor-grab transition-transform duration-150 hover:scale-110"
            onMouseDown={handleBendHandleDrag}
          />
        </g>
      )}

      {isSelected && (
        <g className="pointer-events-auto">
          <circle
            cx={deletePoint.x}
            cy={deletePoint.y}
            r="10"
            className={`cursor-pointer transition-colors duration-200 hover:fill-rose-500 ${deleteFillClass}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          />
          <text
            x={deletePoint.x}
            y={deletePoint.y + 3}
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

function snapToGrid(value: number) {
  return Math.max(0, Math.round(value / 24) * 24);
}
