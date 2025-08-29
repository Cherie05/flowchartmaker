import React, { useState, useRef, useEffect } from 'react';
import { FlowChartNode } from '../types/flowChart';

interface NodeProps {
  node: FlowChartNode;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (position: { x: number; y: number }) => void;
  onTextChange: (text: string) => void;
  onDelete: () => void;
  onConnect: (nodeId: string, side: 'top' | 'right' | 'bottom' | 'left') => void;
}

export function Node({ 
  node, 
  isSelected, 
  isDragging,
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
  const nodeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start drag if clicking on connection points
    if ((e.target as HTMLElement).classList.contains('connection-point')) {
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
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
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

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDraggingNode) {
      setIsEditing(true);
    }
  };

  const handleInputSubmit = () => {
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleInputSubmit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleConnectionPoint = (side: 'top' | 'right' | 'bottom' | 'left') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onConnect(node.id, side);
  };

  const getNodeShape = () => {
    const baseClasses = `absolute select-none transition-all duration-200 border-2 flex items-center justify-center text-sm font-medium ${
      isSelected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
    } ${isDragging ? 'z-50 opacity-75 cursor-grabbing' : 'z-10 cursor-grab'}`;

    switch (node.type) {
      case 'start':
        return `${baseClasses} rounded-full bg-gradient-to-br from-green-400 to-green-500 text-white shadow-md`;
      case 'end':
        return `${baseClasses} rounded-full bg-gradient-to-br from-red-400 to-red-500 text-white shadow-md`;
      case 'process':
        return `${baseClasses} rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-md`;
      case 'decision':
        return `${baseClasses} bg-gradient-to-br from-yellow-400 to-yellow-500 text-white transform rotate-45 shadow-md`;
      case 'connector':
        return `${baseClasses} rounded-full bg-gradient-to-br from-purple-400 to-purple-500 text-white shadow-md`;
      default:
        return `${baseClasses} rounded-lg bg-white shadow-md`;
    }
  };

  return (
    <div
      ref={nodeRef}
      className={`group ${getNodeShape()}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.width,
        height: node.height,
        ...(node.style || {})
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Connection points - only show when selected or hovering */}
      {(isSelected || isDragging) && (
        <>
          <div 
            className="connection-point absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md cursor-pointer hover:bg-blue-600 transition-colors duration-200 z-30"
            style={{ top: -8, left: '50%', transform: 'translateX(-50%)' }}
            onClick={handleConnectionPoint('top')}
            title="Connect from top"
          />
          <div 
            className="connection-point absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md cursor-pointer hover:bg-blue-600 transition-colors duration-200 z-30"
            style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}
            onClick={handleConnectionPoint('right')}
            title="Connect from right"
          />
          <div 
            className="connection-point absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md cursor-pointer hover:bg-blue-600 transition-colors duration-200 z-30"
            style={{ bottom: -8, left: '50%', transform: 'translateX(-50%)' }}
            onClick={handleConnectionPoint('bottom')}
            title="Connect from bottom"
          />
          <div 
            className="connection-point absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md cursor-pointer hover:bg-blue-600 transition-colors duration-200 z-30"
            style={{ left: -8, top: '50%', transform: 'translateY(-50%)' }}
            onClick={handleConnectionPoint('left')}
            title="Connect from left"
          />
        </>
      )}

      {/* Node content */}
      <div className={`w-full h-full flex items-center justify-center p-2 pointer-events-none ${
        node.type === 'decision' ? 'transform -rotate-45' : ''
      }`}>
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

      {/* Delete button */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200 z-40 shadow-md"
          title="Delete node"
        >
          ×
        </button>
      )}
    </div>
  );
}