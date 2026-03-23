import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode
} from 'react';
import type { WorkspaceTheme } from './editor/types';
import type { FlowChartNode, NodeSide } from '../types/flowChart';

interface NodeProps {
  node: FlowChartNode;
  isSelected: boolean;
  isConnectorTarget: boolean;
  showControls: boolean;
  showConnectionHandles: boolean;
  isDragging: boolean;
  zoom: number;
  workspaceTheme: WorkspaceTheme;
  onSelect: (options?: { additive?: boolean }) => void;
  onDragStart: () => void;
  onDrag: (delta: { x: number; y: number }) => void;
  onDragEnd: () => void;
  onResizeStart: () => void;
  onResize: (nextBounds: { x: number; y: number; width: number; height: number }) => void;
  onResizeEnd: () => void;
  onTextChange: (text: string) => void;
  onDelete: () => void;
  onConnectStart: (nodeId: string, side: NodeSide, clientPoint: { clientX: number; clientY: number }) => void;
}

export function Node({
  node,
  isSelected,
  isConnectorTarget,
  showControls,
  showConnectionHandles,
  isDragging,
  zoom,
  workspaceTheme,
  onSelect,
  onDragStart,
  onDrag,
  onDragEnd,
  onResizeStart,
  onResize,
  onResizeEnd,
  onTextChange,
  onDelete,
  onConnectStart
}: NodeProps) {
  const isDark = workspaceTheme === 'dark';
  const [isEditing, setIsEditing] = useState(false);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const borderMode = node.style?.borderStyle ?? 'solid';
  const borderClass =
    borderMode === 'none' ? 'border-transparent' : borderMode === 'dashed' ? 'border-dashed' : 'border-solid';
  const surfaceStateClass = isConnectorTarget
    ? 'ring-4 ring-orange-400/20 shadow-[0_20px_55px_-24px_rgba(251,146,60,0.34)]'
    : isSelected
      ? 'ring-4 ring-sky-400/15 shadow-[0_20px_55px_-24px_rgba(56,189,248,0.32)]'
      : 'shadow-[0_18px_45px_-30px_rgba(15,23,42,0.32)]';
  const {
    textColor,
    fontSize,
    fontWeight,
    textAlign,
    opacity,
    backgroundColor,
    borderColor,
    color,
    ...customStyle
  } = node.style ?? {};

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    if (isEditing || target.classList.contains('connection-point') || target.closest('button, input')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (e.altKey) {
      const rect = e.currentTarget.getBoundingClientRect();
      const side = getClosestSide(
        {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        },
        rect.width,
        rect.height
      );
      onSelect();
      onConnectStart(node.id, side, { clientX: e.clientX, clientY: e.clientY });
      return;
    }

    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      onSelect({ additive: true });
      return;
    }

    onSelect();
    setIsDraggingNode(true);
    onDragStart();

    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoom;
      const deltaY = (moveEvent.clientY - startY) / zoom;

      onDrag({ x: deltaX, y: deltaY });
    };

    const handleMouseUp = () => {
      setIsDraggingNode(false);
      onDragEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (!isDraggingNode) {
      setIsEditing(true);
    }
  };

  const handleInputSubmit = () => {
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      handleInputSubmit();
    }

    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleConnectionPointMouseDown =
    (side: NodeSide) => (e: ReactMouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onConnectStart(node.id, side, { clientX: e.clientX, clientY: e.clientY });
    };

  const handleResizeMouseDown =
    (handle: ResizeHandle) => (e: ReactMouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onSelect();
      onResizeStart();

      const startX = e.clientX;
      const startY = e.clientY;
      const startBounds = {
        x: node.position.x,
        y: node.position.y,
        width: node.width,
        height: node.height
      };

      const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
        const deltaX = (moveEvent.clientX - startX) / zoom;
        const deltaY = (moveEvent.clientY - startY) / zoom;
        onResize(getResizedBounds(startBounds, handle, deltaX, deltaY));
      };

      const handleMouseUp = () => {
        onResizeEnd();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

  const connectionPointClass = isDark
    ? 'border-slate-900 bg-slate-100 shadow-black/20 hover:bg-sky-400'
    : 'border-slate-300 bg-white shadow-slate-300/40 hover:border-sky-300 hover:bg-sky-100';
  const deleteButtonClass = isDark
    ? 'bg-slate-900 text-white hover:bg-rose-500'
    : 'border border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600';
  const resizeHandleClass = isDark
    ? 'border-slate-900 bg-white'
    : 'border-slate-300 bg-white shadow-slate-300/40';
  const surfaceStyle = {
    ...(backgroundColor ? { backgroundColor } : {}),
    ...(borderColor ? { borderColor } : {})
  };
  const shouldShowHandles = showConnectionHandles || isDragging || isHovered;

  return (
    <div
      className={`group absolute pointer-events-auto select-none text-sm font-medium transition-transform duration-200 ${
        isDragging ? 'z-50 cursor-grabbing' : isSelected ? 'z-30 cursor-grab' : 'z-10 cursor-grab hover:-translate-y-0.5'
      } ${getNodeTextClass(node.type)}`}
      data-node-id={node.id}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.width,
        height: node.height,
        ...customStyle,
        ...(typeof opacity === 'number' ? { opacity } : {}),
        ...(textColor ? { color: textColor } : color ? { color } : {})
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {renderNodeSurface(node.type, borderClass, surfaceStateClass, surfaceStyle)}

      {shouldShowHandles && (
        <>
          <div
            className={`connection-point absolute z-30 h-3.5 w-3.5 rounded-full border-2 shadow-md transition-all duration-200 ${connectionPointClass}`}
            style={{ top: -8, left: '50%', transform: 'translateX(-50%)' }}
            onMouseDown={handleConnectionPointMouseDown('top')}
            title="Connect from top"
          />
          <div
            className={`connection-point absolute z-30 h-3.5 w-3.5 rounded-full border-2 shadow-md transition-all duration-200 ${connectionPointClass}`}
            style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}
            onMouseDown={handleConnectionPointMouseDown('right')}
            title="Connect from right"
          />
          <div
            className={`connection-point absolute z-30 h-3.5 w-3.5 rounded-full border-2 shadow-md transition-all duration-200 ${connectionPointClass}`}
            style={{ bottom: -8, left: '50%', transform: 'translateX(-50%)' }}
            onMouseDown={handleConnectionPointMouseDown('bottom')}
            title="Connect from bottom"
          />
          <div
            className={`connection-point absolute z-30 h-3.5 w-3.5 rounded-full border-2 shadow-md transition-all duration-200 ${connectionPointClass}`}
            style={{ left: -8, top: '50%', transform: 'translateY(-50%)' }}
            onMouseDown={handleConnectionPointMouseDown('left')}
            title="Connect from left"
          />
        </>
      )}

      <div
        className="pointer-events-none relative z-10 flex h-full w-full items-center justify-center p-2"
        style={{
          fontSize: fontSize ? `${fontSize}px` : undefined,
          fontWeight,
          textAlign
        }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={node.text}
            onChange={(e) => onTextChange(e.target.value)}
            onBlur={handleInputSubmit}
            onKeyDown={handleInputKeyDown}
            className="w-full text-center bg-transparent border-none outline-none text-inherit pointer-events-auto"
            style={{ fontSize: '12px' }}
          />
        ) : (
          <span className="text-center select-none text-[13px] font-medium leading-[1.35] tracking-[-0.01em]">
            {node.text}
          </span>
        )}
      </div>

      {showControls && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className={`absolute -right-2 -top-2 z-40 flex h-6 w-6 items-center justify-center rounded-full text-xs shadow-md transition-colors duration-200 ${deleteButtonClass}`}
          title="Delete node"
        >
          x
        </button>
      )}

      {showControls &&
        RESIZE_HANDLES.map((handle) => (
          <div
            key={handle}
            className={`absolute z-40 h-3 w-3 rounded-full border shadow-sm ${resizeHandleClass} ${getHandleCursor(handle)}`}
            style={getHandleStyle(handle)}
            onMouseDown={handleResizeMouseDown(handle)}
            title="Resize node"
          />
        ))}
    </div>
  );
}

function getNodeTextClass(type: FlowChartNode['type']): string {
  switch (type) {
    case 'start':
      return 'text-emerald-950';
    case 'end':
      return 'text-rose-950';
    case 'decision':
      return 'text-amber-950';
    case 'connector':
      return 'text-violet-950';
    case 'input':
      return 'text-sky-950';
    case 'manualInput':
      return 'text-fuchsia-950';
    case 'manualOperation':
      return 'text-orange-950';
    case 'hexagon':
      return 'text-cyan-950';
    case 'database':
      return 'text-indigo-950';
    default:
      return 'text-slate-900';
  }
}

function renderNodeSurface(
  type: FlowChartNode['type'],
  borderClass: string,
  surfaceStateClass: string,
  surfaceStyle: CSSProperties
): ReactNode {
  const baseSurfaceClass = `pointer-events-none absolute border ${borderClass} ${surfaceStateClass}`;

  switch (type) {
    case 'start':
      return (
        <div className={`${baseSurfaceClass} inset-0 rounded-full border-emerald-200 bg-emerald-50`} style={surfaceStyle} />
      );
    case 'end':
      return (
        <div className={`${baseSurfaceClass} inset-0 rounded-full border-rose-200 bg-rose-50`} style={surfaceStyle} />
      );
    case 'process':
      return (
        <div className={`${baseSurfaceClass} inset-0 rounded-[24px] border-sky-200 bg-white`} style={surfaceStyle} />
      );
    case 'decision':
      return (
        <div
          className={`${baseSurfaceClass} inset-[12%] rounded-[24px] border-amber-200 bg-amber-50`}
          style={{ ...surfaceStyle, transform: 'rotate(45deg)' }}
        />
      );
    case 'connector':
      return (
        <div className={`${baseSurfaceClass} inset-0 rounded-full border-violet-200 bg-violet-50`} style={surfaceStyle} />
      );
    case 'input':
      return (
        <div
          className={`${baseSurfaceClass} inset-0 border-sky-200 bg-sky-50 [clip-path:polygon(10%_0,100%_0,90%_100%,0_100%)]`}
          style={surfaceStyle}
        />
      );
    case 'manualInput':
      return (
        <div
          className={`${baseSurfaceClass} inset-0 border-fuchsia-200 bg-fuchsia-50 [clip-path:polygon(0_16%,100%_0,100%_100%,0_100%)]`}
          style={surfaceStyle}
        />
      );
    case 'manualOperation':
      return (
        <div
          className={`${baseSurfaceClass} inset-0 border-orange-200 bg-orange-50 [clip-path:polygon(10%_0,90%_0,100%_100%,0_100%)]`}
          style={surfaceStyle}
        />
      );
    case 'triangle':
      return (
        <div
          className={`${baseSurfaceClass} inset-0 border-slate-300 bg-slate-50 [clip-path:polygon(50%_0,100%_100%,0_100%)]`}
          style={surfaceStyle}
        />
      );
    case 'hexagon':
      return (
        <div
          className={`${baseSurfaceClass} inset-0 border-cyan-200 bg-cyan-50 [clip-path:polygon(14%_0,86%_0,100%_50%,86%_100%,14%_100%,0_50%)]`}
          style={surfaceStyle}
        />
      );
    case 'database':
      return (
        <>
          <div className={`${baseSurfaceClass} inset-0 rounded-[28px] border-indigo-200 bg-indigo-50`} style={surfaceStyle} />
          <div className="pointer-events-none absolute inset-x-3 top-2 h-3 rounded-full border border-current/20 bg-white/35" />
          <div className="pointer-events-none absolute inset-x-3 bottom-2 h-3 rounded-full border border-current/20 bg-white/20" />
        </>
      );
    case 'annotation':
      return (
        <>
          <div className={`${baseSurfaceClass} inset-0 rounded-[18px] border-slate-200 bg-white`} style={surfaceStyle} />
          <div
            className="pointer-events-none absolute left-4 top-4 h-8 w-[3px] rounded-full bg-slate-300/80"
            style={borderColorFromSurface(surfaceStyle)}
          />
        </>
      );
    default:
      return <div className={`${baseSurfaceClass} inset-0 rounded-[24px] border-slate-200 bg-white`} style={surfaceStyle} />;
  }
}

function borderColorFromSurface(surfaceStyle: CSSProperties): CSSProperties | undefined {
  if (typeof surfaceStyle.borderColor !== 'string' || !surfaceStyle.borderColor) {
    return undefined;
  }

  return { backgroundColor: surfaceStyle.borderColor };
}

type ResizeHandle = 'n' | 'e' | 's' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const RESIZE_HANDLES: ResizeHandle[] = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'];

function getHandleCursor(handle: ResizeHandle): string {
  switch (handle) {
    case 'n':
    case 's':
      return 'cursor-ns-resize';
    case 'e':
    case 'w':
      return 'cursor-ew-resize';
    case 'ne':
    case 'sw':
      return 'cursor-nesw-resize';
    case 'nw':
    case 'se':
      return 'cursor-nwse-resize';
    default:
      return 'cursor-pointer';
  }
}

function getHandleStyle(handle: ResizeHandle): CSSProperties {
  const shared = { transform: 'translate(-50%, -50%)' };

  switch (handle) {
    case 'n':
      return { ...shared, left: '50%', top: 0 };
    case 'e':
      return { ...shared, left: '100%', top: '50%' };
    case 's':
      return { ...shared, left: '50%', top: '100%' };
    case 'w':
      return { ...shared, left: 0, top: '50%' };
    case 'ne':
      return { ...shared, left: '100%', top: 0 };
    case 'nw':
      return { ...shared, left: 0, top: 0 };
    case 'se':
      return { ...shared, left: '100%', top: '100%' };
    case 'sw':
      return { ...shared, left: 0, top: '100%' };
    default:
      return shared;
  }
}

function getResizedBounds(
  startBounds: { x: number; y: number; width: number; height: number },
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number
): { x: number; y: number; width: number; height: number } {
  const minWidth = 72;
  const minHeight = 48;

  let nextX = startBounds.x;
  let nextY = startBounds.y;
  let nextWidth = startBounds.width;
  let nextHeight = startBounds.height;

  if (handle.includes('e')) {
    nextWidth = Math.max(minWidth, startBounds.width + deltaX);
  }

  if (handle.includes('s')) {
    nextHeight = Math.max(minHeight, startBounds.height + deltaY);
  }

  if (handle.includes('w')) {
    nextWidth = Math.max(minWidth, startBounds.width - deltaX);
    nextX = startBounds.x + (startBounds.width - nextWidth);
  }

  if (handle.includes('n')) {
    nextHeight = Math.max(minHeight, startBounds.height - deltaY);
    nextY = startBounds.y + (startBounds.height - nextHeight);
  }

  return {
    x: Math.max(0, nextX),
    y: Math.max(0, nextY),
    width: nextWidth,
    height: nextHeight
  };
}

function getClosestSide(
  point: { x: number; y: number },
  width: number,
  height: number
): NodeSide {
  const distances: Record<NodeSide, number> = {
    top: point.y,
    right: width - point.x,
    bottom: height - point.y,
    left: point.x
  };

  return (Object.entries(distances).sort((left, right) => left[1] - right[1])[0]?.[0] ?? 'right') as NodeSide;
}
