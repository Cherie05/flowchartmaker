import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent
} from 'react';
import type { FlowChartNode, NodeSide } from '../types/flowChart';

interface NodeProps {
  node: FlowChartNode;
  isSelected: boolean;
  isDragging: boolean;
  zoom: number;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (position: { x: number; y: number }) => void;
  onTextChange: (text: string) => void;
  onDelete: () => void;
  onConnect: (nodeId: string, side: NodeSide) => void;
}

export function Node({
  node,
  isSelected,
  isDragging,
  zoom,
  onSelect,
  onDragStart,
  onDragEnd,
  onMove,
  onTextChange,
  onDelete,
  onConnect
}: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    onSelect();
    setIsDraggingNode(true);
    onDragStart();

    const startX = e.clientX;
    const startY = e.clientY;
    const startNodeX = node.position.x;
    const startNodeY = node.position.y;

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoom;
      const deltaY = (moveEvent.clientY - startY) / zoom;

      onMove({
        x: Math.max(0, startNodeX + deltaX),
        y: Math.max(0, startNodeY + deltaY)
      });
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

  const handleConnectionPoint =
    (side: NodeSide) => (e: ReactMouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onConnect(node.id, side);
    };

  const getNodeShape = () => {
    const baseClasses = [
      'absolute pointer-events-auto select-none border text-sm font-medium',
      'flex items-center justify-center transition-[transform,box-shadow,border-color,opacity] duration-200',
      isSelected
        ? 'border-sky-400 ring-4 ring-sky-400/15 shadow-[0_20px_55px_-24px_rgba(56,189,248,0.32)]'
        : 'shadow-[0_18px_45px_-30px_rgba(15,23,42,0.32)] hover:-translate-y-0.5',
      isDragging ? 'z-50 opacity-80 cursor-grabbing' : 'z-10 cursor-grab'
    ].join(' ');

    switch (node.type) {
      case 'start':
        return `${baseClasses} rounded-full border-emerald-200 bg-emerald-50 text-emerald-950`;
      case 'end':
        return `${baseClasses} rounded-full border-rose-200 bg-rose-50 text-rose-950`;
      case 'process':
        return `${baseClasses} rounded-[24px] border-sky-200 bg-white text-slate-900`;
      case 'decision':
        return `${baseClasses} rounded-[26px] border-amber-200 bg-amber-50 text-amber-950 transform rotate-45`;
      case 'connector':
        return `${baseClasses} rounded-full border-violet-200 bg-violet-50 text-violet-950`;
      default:
        return `${baseClasses} rounded-[24px] border-slate-200 bg-white text-slate-900`;
    }
  };

  const { textColor, ...customStyle } = node.style ?? {};

  return (
    <div
      className={`group ${getNodeShape()}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.width,
        height: node.height,
        ...customStyle,
        ...(textColor ? { color: textColor } : {})
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {(isSelected || isDragging) && (
        <>
          <div
            className="connection-point absolute z-30 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-slate-100 shadow-md shadow-black/20 transition-colors duration-200 hover:bg-sky-400"
            style={{ top: -8, left: '50%', transform: 'translateX(-50%)' }}
            onClick={handleConnectionPoint('top')}
            title="Connect from top"
          />
          <div
            className="connection-point absolute z-30 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-slate-100 shadow-md shadow-black/20 transition-colors duration-200 hover:bg-sky-400"
            style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}
            onClick={handleConnectionPoint('right')}
            title="Connect from right"
          />
          <div
            className="connection-point absolute z-30 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-slate-100 shadow-md shadow-black/20 transition-colors duration-200 hover:bg-sky-400"
            style={{ bottom: -8, left: '50%', transform: 'translateX(-50%)' }}
            onClick={handleConnectionPoint('bottom')}
            title="Connect from bottom"
          />
          <div
            className="connection-point absolute z-30 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-slate-100 shadow-md shadow-black/20 transition-colors duration-200 hover:bg-sky-400"
            style={{ left: -8, top: '50%', transform: 'translateY(-50%)' }}
            onClick={handleConnectionPoint('left')}
            title="Connect from left"
          />
        </>
      )}

      <div
        className={`w-full h-full flex items-center justify-center p-2 pointer-events-none ${
          node.type === 'decision' ? 'transform -rotate-45' : ''
        }`}
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
          <span className="text-center select-none text-xs leading-tight">{node.text}</span>
        )}
      </div>

      {isSelected && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -right-2 -top-2 z-40 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs text-white shadow-md transition-colors duration-200 hover:bg-rose-500"
          title="Delete node"
        >
          x
        </button>
      )}
    </div>
  );
}
