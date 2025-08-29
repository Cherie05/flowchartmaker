import { useState, useCallback, useRef, useEffect } from 'react';
import { FlowChart, FlowChartNode, Connection, Position } from '../types/flowChart';

interface UseFlowChartReturn {
  flowChart: FlowChart;
  selectedNode: string | null;
  draggedNode: string | null;
  setSelectedNode: (nodeId: string | null) => void;
  addNode: (type: FlowChartNode['type'], position: Position) => void;
  updateNode: (nodeId: string, updates: Partial<FlowChartNode>) => void;
  deleteNode: (nodeId: string) => void;
  addConnection: (from: string, to: string, fromSide?: Connection['fromSide'], toSide?: Connection['toSide']) => void;
  deleteConnection: (connectionId: string) => void;
  startDrag: (nodeId: string) => void;
  endDrag: () => void;
  moveNode: (nodeId: string, position: Position) => void;
  clearAll: () => void;
  loadFlowChart: (flowChart: FlowChart) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useFlowChart(): UseFlowChartReturn {
  const [flowChart, setFlowChart] = useState<FlowChart>({
    id: '1',
    name: 'New FlowChart',
    nodes: [],
    connections: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  
  const historyRef = useRef<FlowChart[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // Initialize history with empty state
  useEffect(() => {
    if (historyRef.current.length === 0) {
      historyRef.current.push({ ...flowChart });
      historyIndexRef.current = 0;
    }
  }, []);

  const saveToHistory = useCallback((newFlowChart: FlowChart) => {
    // Remove any future history if we're not at the end
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(JSON.parse(JSON.stringify(newFlowChart)));
    historyIndexRef.current = historyRef.current.length - 1;
    
    // Limit history size
    if (historyRef.current.length > 50) {
      historyRef.current = historyRef.current.slice(-50);
      historyIndexRef.current = historyRef.current.length - 1;
    }
  }, []);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addNode = useCallback((type: FlowChartNode['type'], position: Position) => {
    const newNode: FlowChartNode = {
      id: generateId(),
      type,
      position,
      text: getDefaultText(type),
      width: getDefaultWidth(type),
      height: getDefaultHeight(type)
    };

    setFlowChart(prev => {
      const updated = {
        ...prev,
        nodes: [...prev.nodes, newNode],
        updatedAt: new Date()
      };
      saveToHistory(updated);
      return updated;
    });
  }, [saveToHistory]);

  const updateNode = useCallback((nodeId: string, updates: Partial<FlowChartNode>) => {
    setFlowChart(prev => {
      const updated = {
        ...prev,
        nodes: prev.nodes.map(node => 
          node.id === nodeId ? { ...node, ...updates } : node
        ),
        updatedAt: new Date()
      };
      saveToHistory(updated);
      return updated;
    });
  }, [saveToHistory]);

  const deleteNode = useCallback((nodeId: string) => {
    setFlowChart(prev => {
      const updated = {
        ...prev,
        nodes: prev.nodes.filter(node => node.id !== nodeId),
        connections: prev.connections.filter(conn => 
          conn.from !== nodeId && conn.to !== nodeId
        ),
        updatedAt: new Date()
      };
      saveToHistory(updated);
      return updated;
    });
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode, saveToHistory]);

  const addConnection = useCallback((
    from: string, 
    to: string, 
    fromSide: Connection['fromSide'] = 'bottom',
    toSide: Connection['toSide'] = 'top'
  ) => {
    // Check if connection already exists
    const connectionExists = flowChart.connections.some(
      conn => (conn.from === from && conn.to === to) || (conn.from === to && conn.to === from)
    );
    
    if (!connectionExists && from !== to) {
      const newConnection: Connection = {
        id: generateId(),
        from,
        to,
        fromSide,
        toSide
      };

      setFlowChart(prev => {
        const updated = {
          ...prev,
          connections: [...prev.connections, newConnection],
          updatedAt: new Date()
        };
        saveToHistory(updated);
        return updated;
      });
    }
  }, [flowChart.connections, saveToHistory]);

  const deleteConnection = useCallback((connectionId: string) => {
    setFlowChart(prev => {
      const updated = {
        ...prev,
        connections: prev.connections.filter(conn => conn.id !== connectionId),
        updatedAt: new Date()
      };
      saveToHistory(updated);
      return updated;
    });
  }, [saveToHistory]);

  const startDrag = useCallback((nodeId: string) => {
    setDraggedNode(nodeId);
  }, []);

  const endDrag = useCallback(() => {
    setDraggedNode(null);
  }, []);

  const moveNode = useCallback((nodeId: string, position: Position) => {
    setFlowChart(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, position } : node
      ),
      updatedAt: new Date()
    }));
  }, []);

  const clearAll = useCallback(() => {
    const clearedChart = {
      id: flowChart.id,
      name: flowChart.name,
      nodes: [],
      connections: [],
      createdAt: flowChart.createdAt,
      updatedAt: new Date()
    };
    
    setFlowChart(clearedChart);
    saveToHistory(clearedChart);
    setSelectedNode(null);
  }, [flowChart.id, flowChart.name, flowChart.createdAt, saveToHistory]);

  const loadFlowChart = useCallback((newFlowChart: FlowChart) => {
    setFlowChart(newFlowChart);
    setSelectedNode(null);
    saveToHistory(newFlowChart);
  }, [saveToHistory]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const previousState = historyRef.current[historyIndexRef.current];
      setFlowChart(JSON.parse(JSON.stringify(previousState)));
      setSelectedNode(null);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const nextState = historyRef.current[historyIndexRef.current];
      setFlowChart(JSON.parse(JSON.stringify(nextState)));
      setSelectedNode(null);
    }
  }, []);

  return {
    flowChart,
    selectedNode,
    draggedNode,
    setSelectedNode,
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    deleteConnection,
    startDrag,
    endDrag,
    moveNode,
    clearAll,
    loadFlowChart,
    undo,
    redo,
    canUndo: historyIndexRef.current > 0,
    canRedo: historyIndexRef.current < historyRef.current.length - 1
  };
}

function getDefaultText(type: FlowChartNode['type']): string {
  switch (type) {
    case 'start': return 'Start';
    case 'process': return 'Process Step';
    case 'decision': return 'Decision?';
    case 'end': return 'End';
    case 'connector': return 'Connector';
    default: return 'Node';
  }
}

function getDefaultWidth(type: FlowChartNode['type']): number {
  switch (type) {
    case 'start':
    case 'end': return 100;
    case 'decision': return 120;
    case 'connector': return 80;
    default: return 140;
  }
}

function getDefaultHeight(type: FlowChartNode['type']): number {
  switch (type) {
    case 'start':
    case 'end': return 60;
    case 'connector': return 60;
    default: return 80;
  }
}