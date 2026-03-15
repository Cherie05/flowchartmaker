import { useCallback, useEffect, useRef, useState } from 'react';
import { createId } from '../lib/createId';
import type { Connection, FlowChart, FlowChartNode, Position } from '../types/flowChart';

interface UseFlowChartReturn {
  flowChart: FlowChart;
  selectedNode: string | null;
  draggedNode: string | null;
  setSelectedNode: (nodeId: string | null) => void;
  addNode: (type: FlowChartNode['type'], position: Position) => void;
  updateNode: (nodeId: string, updates: Partial<FlowChartNode>) => void;
  deleteNode: (nodeId: string) => void;
  addConnection: (
    from: string,
    to: string,
    fromSide?: Connection['fromSide'],
    toSide?: Connection['toSide']
  ) => void;
  deleteConnection: (connectionId: string) => void;
  startDrag: (nodeId: string) => void;
  endDrag: () => void;
  moveNode: (nodeId: string, position: Position) => void;
  clearAll: () => void;
  replaceFlowChartContent: (content: {
    nodes: FlowChartNode[];
    connections: Connection[];
    name?: string;
  }) => void;
  loadFlowChart: (flowChart: FlowChart) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useFlowChart(): UseFlowChartReturn {
  const [flowChart, setFlowChart] = useState<FlowChart>(() => createInitialFlowChart());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  const latestFlowChartRef = useRef<FlowChart>(flowChart);
  const historyRef = useRef<FlowChart[]>([cloneFlowChart(flowChart)]);
  const historyIndexRef = useRef<number>(0);
  const dragOriginRef = useRef<{ nodeId: string; position: Position } | null>(null);

  useEffect(() => {
    latestFlowChartRef.current = flowChart;
  }, [flowChart]);

  const saveToHistory = useCallback((newFlowChart: FlowChart) => {
    const snapshot = cloneFlowChart(newFlowChart);

    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(snapshot);
    historyIndexRef.current = historyRef.current.length - 1;

    if (historyRef.current.length > 50) {
      historyRef.current = historyRef.current.slice(-50);
      historyIndexRef.current = historyRef.current.length - 1;
    }
  }, []);

  const resetHistory = useCallback((newFlowChart: FlowChart) => {
    historyRef.current = [cloneFlowChart(newFlowChart)];
    historyIndexRef.current = 0;
  }, []);

  const addNode = useCallback((type: FlowChartNode['type'], position: Position) => {
    const newNode: FlowChartNode = {
      id: createId('node'),
      type,
      position,
      text: getDefaultText(type),
      width: getDefaultWidth(type),
      height: getDefaultHeight(type)
    };

    setFlowChart((prev) => {
      const updated = {
        ...prev,
        nodes: [...prev.nodes, newNode],
        updatedAt: new Date()
      };

      latestFlowChartRef.current = updated;
      saveToHistory(updated);
      return updated;
    });
  }, [saveToHistory]);

  const updateNode = useCallback((nodeId: string, updates: Partial<FlowChartNode>) => {
    setFlowChart((prev) => {
      let didUpdate = false;

      const updated = {
        ...prev,
        nodes: prev.nodes.map((node) => {
          if (node.id !== nodeId) {
            return node;
          }

          didUpdate = true;

          return {
            ...node,
            ...updates,
            position: updates.position ? { ...updates.position } : node.position,
            style: updates.style ? { ...node.style, ...updates.style } : node.style
          };
        }),
        updatedAt: new Date()
      };

      if (!didUpdate) {
        return prev;
      }

      latestFlowChartRef.current = updated;
      saveToHistory(updated);
      return updated;
    });
  }, [saveToHistory]);

  const deleteNode = useCallback((nodeId: string) => {
    setFlowChart((prev) => {
      const updated = {
        ...prev,
        nodes: prev.nodes.filter((node) => node.id !== nodeId),
        connections: prev.connections.filter((connection) => connection.from !== nodeId && connection.to !== nodeId),
        updatedAt: new Date()
      };

      latestFlowChartRef.current = updated;
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
    setFlowChart((prev) => {
      const connectionExists = prev.connections.some(
        (connection) =>
          (connection.from === from && connection.to === to) ||
          (connection.from === to && connection.to === from)
      );

      if (connectionExists || from === to) {
        return prev;
      }

      const newConnection: Connection = {
        id: createId('connection'),
        from,
        to,
        fromSide,
        toSide
      };

      const updated = {
        ...prev,
        connections: [...prev.connections, newConnection],
        updatedAt: new Date()
      };

      latestFlowChartRef.current = updated;
      saveToHistory(updated);
      return updated;
    });
  }, [saveToHistory]);

  const deleteConnection = useCallback((connectionId: string) => {
    setFlowChart((prev) => {
      if (!prev.connections.some((connection) => connection.id === connectionId)) {
        return prev;
      }

      const updated = {
        ...prev,
        connections: prev.connections.filter((connection) => connection.id !== connectionId),
        updatedAt: new Date()
      };

      latestFlowChartRef.current = updated;
      saveToHistory(updated);
      return updated;
    });
  }, [saveToHistory]);

  const startDrag = useCallback((nodeId: string) => {
    const node = latestFlowChartRef.current.nodes.find((item) => item.id === nodeId);
    dragOriginRef.current = node ? { nodeId, position: { ...node.position } } : null;
    setDraggedNode(nodeId);
  }, []);

  const endDrag = useCallback(() => {
    const dragOrigin = dragOriginRef.current;
    dragOriginRef.current = null;
    setDraggedNode(null);

    if (!dragOrigin) {
      return;
    }

    const currentNode = latestFlowChartRef.current.nodes.find((node) => node.id === dragOrigin.nodeId);

    if (
      currentNode &&
      (currentNode.position.x !== dragOrigin.position.x ||
        currentNode.position.y !== dragOrigin.position.y)
    ) {
      saveToHistory(latestFlowChartRef.current);
    }
  }, [saveToHistory]);

  const moveNode = useCallback((nodeId: string, position: Position) => {
    setFlowChart((prev) => {
      let didMove = false;

      const updated = {
        ...prev,
        nodes: prev.nodes.map((node) => {
          if (node.id !== nodeId) {
            return node;
          }

          if (node.position.x === position.x && node.position.y === position.y) {
            return node;
          }

          didMove = true;
          return { ...node, position };
        }),
        updatedAt: new Date()
      };

      if (!didMove) {
        return prev;
      }

      latestFlowChartRef.current = updated;
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setFlowChart((prev) => {
      const clearedChart = {
        ...prev,
        nodes: [],
        connections: [],
        updatedAt: new Date()
      };

      latestFlowChartRef.current = clearedChart;
      saveToHistory(clearedChart);
      return clearedChart;
    });

    setSelectedNode(null);
  }, [saveToHistory]);

  const replaceFlowChartContent = useCallback((content: {
    nodes: FlowChartNode[];
    connections: Connection[];
    name?: string;
  }) => {
    setFlowChart((prev) => {
      const updated = {
        ...prev,
        name: content.name ?? prev.name,
        nodes: content.nodes.map(cloneNode),
        connections: content.connections.map(cloneConnection),
        updatedAt: new Date()
      };

      latestFlowChartRef.current = updated;
      saveToHistory(updated);
      return updated;
    });

    setSelectedNode(null);
    setDraggedNode(null);
    dragOriginRef.current = null;
  }, [saveToHistory]);

  const loadFlowChart = useCallback((newFlowChart: FlowChart) => {
    const normalizedFlowChart = cloneFlowChart(newFlowChart);
    latestFlowChartRef.current = normalizedFlowChart;
    setFlowChart(normalizedFlowChart);
    setSelectedNode(null);
    setDraggedNode(null);
    dragOriginRef.current = null;
    resetHistory(normalizedFlowChart);
  }, [resetHistory]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const previousState = cloneFlowChart(historyRef.current[historyIndexRef.current]);
      latestFlowChartRef.current = previousState;
      setFlowChart(previousState);
      setSelectedNode(null);
      setDraggedNode(null);
      dragOriginRef.current = null;
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const nextState = cloneFlowChart(historyRef.current[historyIndexRef.current]);
      latestFlowChartRef.current = nextState;
      setFlowChart(nextState);
      setSelectedNode(null);
      setDraggedNode(null);
      dragOriginRef.current = null;
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
    replaceFlowChartContent,
    loadFlowChart,
    undo,
    redo,
    canUndo: historyIndexRef.current > 0,
    canRedo: historyIndexRef.current < historyRef.current.length - 1
  };
}

function createInitialFlowChart(): FlowChart {
  return {
    id: '1',
    name: 'New FlowChart',
    nodes: [],
    connections: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function cloneNode(node: FlowChartNode): FlowChartNode {
  return {
    ...node,
    position: { ...node.position },
    style: node.style ? { ...node.style } : undefined
  };
}

function cloneConnection(connection: Connection): Connection {
  return { ...connection };
}

function cloneFlowChart(flowChart: FlowChart): FlowChart {
  return {
    ...flowChart,
    nodes: flowChart.nodes.map(cloneNode),
    connections: flowChart.connections.map(cloneConnection),
    createdAt: new Date(flowChart.createdAt),
    updatedAt: new Date(flowChart.updatedAt)
  };
}

function getDefaultText(type: FlowChartNode['type']): string {
  switch (type) {
    case 'start':
      return 'Start';
    case 'process':
      return 'Process Step';
    case 'decision':
      return 'Decision?';
    case 'end':
      return 'End';
    case 'connector':
      return 'Connector';
    default:
      return 'Node';
  }
}

function getDefaultWidth(type: FlowChartNode['type']): number {
  switch (type) {
    case 'start':
    case 'end':
      return 100;
    case 'decision':
      return 120;
    case 'connector':
      return 80;
    default:
      return 140;
  }
}

function getDefaultHeight(type: FlowChartNode['type']): number {
  switch (type) {
    case 'start':
    case 'end':
    case 'connector':
      return 60;
    default:
      return 80;
  }
}
