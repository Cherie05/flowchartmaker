import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Circle,
  Database,
  Diamond,
  Hexagon,
  Loader,
  Play,
  Square,
  Square as StopSquare,
  Triangle
} from 'lucide-react';
import { ConnectionLine } from '../components/ConnectionLine';
import { Node } from '../components/Node';
import { EditorCanvasChrome } from '../components/editor/EditorCanvasChrome';
import { CommandMenu, type CommandMenuItem } from '../components/editor/CommandMenu';
import { ConnectorQuickAdd } from '../components/editor/ConnectorQuickAdd';
import { EditorMinimap } from '../components/editor/EditorMinimap';
import { EditorSidebar } from '../components/editor/EditorSidebar';
import { SelectionContextBar } from '../components/editor/SelectionContextBar';
import { EditorToolRail } from '../components/editor/EditorToolRail';
import { EditorTopBar } from '../components/editor/EditorTopBar';
import type { WorkspaceNodeType, WorkspaceTheme } from '../components/editor/types';
import { useFlowChart } from '../hooks/useFlowChart';
import { createId } from '../lib/createId';
import { buildConnectionGeometry } from '../lib/connectionRouting';
import { getErrorMessage } from '../lib/errors';
import { buildFlowchartExport, svgToPngDataUrl } from '../lib/flowchartExport';
import { aiService } from '../services/aiService';
import { flowchartService } from '../services/flowchartService';
import type { AIFlowChartResponse, Connection, ConnectionType, FlowChartNode, NodeSide, Position } from '../types/flowChart';

const WORKSPACE_PADDING = 520;
const WORKSPACE_SAFE_LEFT = 420;
const WORKSPACE_SAFE_TOP = 320;
const MIN_WORKSPACE_WIDTH = 6400;
const MIN_WORKSPACE_HEIGHT = 4200;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.2;
const WORKSPACE_THEME_STORAGE_KEY = 'flowchart-workspace-theme';
const WORKSPACE_LEFT_PANEL_STORAGE_KEY = 'flowchart-workspace-left-panel-collapsed';
const WORKSPACE_RIGHT_PANEL_STORAGE_KEY = 'flowchart-workspace-right-panel-collapsed';
const WORKSPACE_TOP_BAR_STORAGE_KEY = 'flowchart-workspace-top-bar-collapsed';
const WORKSPACE_HINTS_STORAGE_KEY = 'flowchart-workspace-hints-visible';
const WORKSPACE_DEFAULT_STYLE_STORAGE_KEY = 'flowchart-workspace-default-styles';
const GRID_SIZE = 24;
const PASTE_OFFSET = 48;

type NodeStyleDefaults = Partial<NonNullable<FlowChartNode['style']>>;
type DefaultStyleMap = Partial<Record<FlowChartNode['type'], NodeStyleDefaults>>;

interface SelectionBoxState {
  x: number;
  y: number;
  width: number;
  height: number;
  additive: boolean;
}

interface ClipboardSelection {
  nodes: FlowChartNode[];
  connections: Connection[];
}

interface DragConnectorState {
  fromNodeId: string;
  fromSide: NodeSide;
  pointer: Position;
  targetNodeId: string | null;
  targetSide: NodeSide | null;
}

type ConnectorQuickAddState = {
  nodeId: string;
  handleId: string;
};

type AlignmentGuide = {
  type: 'vertical' | 'horizontal';
  position: number;
  start: number;
  end: number;
};

export function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    flowChart,
    draggedNode,
    setSelectedNode,
    updateNode,
    addConnection,
    deleteConnection,
    updateConnection,
    startDrag,
    endDrag,
    clearAll,
    replaceFlowChartContent,
    undo,
    redo,
    transformFlowChart,
    captureHistorySnapshot,
    canUndo,
    canRedo,
    loadFlowChart
  } = useFlowChart();

  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<SelectionBoxState | null>(null);
  const [dragConnector, setDragConnector] = useState<DragConnectorState | null>(null);
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);
  const [connectorQuickAdd, setConnectorQuickAdd] = useState<ConnectorQuickAddState | null>(null);
  const [commandMenuQuery, setCommandMenuQuery] = useState('');
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [flowchartName, setFlowchartName] = useState('Untitled Flowchart');
  const canvasRef = useRef<HTMLDivElement>(null);
  const workspaceViewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiTextareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const saveStatusTimeoutRef = useRef<number | null>(null);
  const clipboardSelectionRef = useRef<ClipboardSelection | null>(null);
  const dragConnectorRef = useRef<DragConnectorState | null>(null);
  const selectionOriginRef = useRef<Position | null>(null);
  const selectionBoxRef = useRef<SelectionBoxState | null>(null);
  const selectionStartedRef = useRef(false);
  const dragStartPositionsRef = useRef<Record<string, Position> | null>(null);
  const pasteCountRef = useRef(0);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [viewportState, setViewportState] = useState({
    scrollLeft: 0,
    scrollTop: 0,
    width: 0,
    height: 0
  });
  const [zoom, setZoom] = useState(1);
  const [presentationMode, setPresentationMode] = useState(false);
  const [isLeftRailCollapsed, setIsLeftRailCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem(WORKSPACE_LEFT_PANEL_STORAGE_KEY) === 'true';
  });
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem(WORKSPACE_RIGHT_PANEL_STORAGE_KEY) === 'true';
  });
  const [isTopBarCollapsed, setIsTopBarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(WORKSPACE_TOP_BAR_STORAGE_KEY) === 'true';
  });
  const [showCanvasHints, setShowCanvasHints] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.localStorage.getItem(WORKSPACE_HINTS_STORAGE_KEY) !== 'false';
  });
  const [lastUsedNodeType, setLastUsedNodeType] = useState<FlowChartNode['type']>('process');
  const [defaultNodeStyles, setDefaultNodeStyles] = useState<DefaultStyleMap>(() => {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const raw = window.localStorage.getItem(WORKSPACE_DEFAULT_STYLE_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as DefaultStyleMap) : {};
    } catch {
      return {};
    }
  });
  const [workspaceTheme, setWorkspaceTheme] = useState<WorkspaceTheme>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const stored = window.localStorage.getItem(WORKSPACE_THEME_STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  });
  const zoomRef = useRef(zoom);

  const persistFlowchart = useCallback(async () => {
    if (!id) {
      return;
    }

    await flowchartService.updateFlowchart(id, {
      name: flowchartName.trim() || 'Untitled Flowchart',
      nodes: flowChart.nodes,
      connections: flowChart.connections
    });
  }, [flowChart.connections, flowChart.nodes, flowchartName, id]);

  const applyZoom = useCallback((nextZoom: number, anchorPoint?: { clientX: number; clientY: number }) => {
    const viewport = workspaceViewportRef.current;
    const clampedZoom = clampZoom(nextZoom);

    if (!viewport) {
      setZoom(clampedZoom);
      return;
    }

    const rect = viewport.getBoundingClientRect();
    const anchorX = anchorPoint ? anchorPoint.clientX - rect.left : viewport.clientWidth / 2;
    const anchorY = anchorPoint ? anchorPoint.clientY - rect.top : viewport.clientHeight / 2;
    const workspaceX = (viewport.scrollLeft + anchorX) / zoomRef.current;
    const workspaceY = (viewport.scrollTop + anchorY) / zoomRef.current;

    setZoom(clampedZoom);

    window.requestAnimationFrame(() => {
      const currentViewport = workspaceViewportRef.current;

      if (!currentViewport) {
        return;
      }

      currentViewport.scrollLeft = Math.max(0, workspaceX * clampedZoom - anchorX);
      currentViewport.scrollTop = Math.max(0, workspaceY * clampedZoom - anchorY);
    });
  }, []);

  const scheduleScrollToNodes = useCallback((nodes: FlowChartNode[]) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const viewport = workspaceViewportRef.current;

        if (!viewport) {
          return;
        }

        if (!nodes.length) {
          const emptyMetrics = getWorkspaceMetrics([]);
          setZoom(1);
          viewport.scrollTo({
            left: Math.max(0, emptyMetrics.width / 2 - viewport.clientWidth / 2),
            top: Math.max(0, emptyMetrics.height / 2 - viewport.clientHeight / 2),
            behavior: 'smooth'
          });
          return;
        }

        const bounds = getNodeBounds(nodes);
        const boundsWidth = bounds.maxX - bounds.minX + 320;
        const boundsHeight = bounds.maxY - bounds.minY + 260;
        const fitZoom = clampZoom(
          Math.min(viewport.clientWidth / boundsWidth, viewport.clientHeight / boundsHeight, 1)
        );
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;

        setZoom(fitZoom);

        window.requestAnimationFrame(() => {
          const currentViewport = workspaceViewportRef.current;

          if (!currentViewport) {
            return;
          }

          currentViewport.scrollTo({
            left: Math.max(0, centerX * fitZoom - currentViewport.clientWidth / 2),
            top: Math.max(0, centerY * fitZoom - currentViewport.clientHeight / 2),
            behavior: 'smooth'
          });
        });
      });
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    applyZoom(zoomRef.current * 1.15);
  }, [applyZoom]);

  const handleZoomOut = useCallback(() => {
    applyZoom(zoomRef.current / 1.15);
  }, [applyZoom]);

  const handleResetZoom = useCallback(() => {
    applyZoom(1);
  }, [applyZoom]);

  const loadExistingFlowchart = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      const data = await flowchartService.getFlowchartById(id);

      if (!data) {
        setErrorMessage('Flowchart not found.');
        return;
      }

      const { nodes: positionedNodes, connections: positionedConnections } = applyWorkspacePadding(
        data.nodes || [],
        data.connections || []
      );

      loadFlowChart({
        id: data.id,
        name: data.name,
        nodes: positionedNodes,
        connections: positionedConnections,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      });
      setFlowchartName(data.name);
      scheduleScrollToNodes(positionedNodes);
    } catch (error) {
      console.error('Failed to load flowchart:', error);
      setErrorMessage(getErrorMessage(error, 'Failed to load this flowchart.'));
    } finally {
      setLoading(false);
    }
  }, [id, loadFlowChart, scheduleScrollToNodes]);

  useEffect(() => {
    if (id) {
      loadExistingFlowchart();
    } else {
      setLoading(false);
    }
  }, [id, loadExistingFlowchart]);

  useEffect(() => {
    if (!loading && id) {
      if (autoSaveTimeoutRef.current) {
        window.clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = window.setTimeout(() => {
        persistFlowchart().catch((error) => {
          console.error('Auto-save failed:', error);
          setErrorMessage(getErrorMessage(error, 'Auto-save failed. Your latest changes are only local.'));
        });
      }, 2000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        window.clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [id, loading, persistFlowchart]);

  useEffect(() => {
    return () => {
      if (saveStatusTimeoutRef.current) {
        window.clearTimeout(saveStatusTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(WORKSPACE_THEME_STORAGE_KEY, workspaceTheme);
  }, [workspaceTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(WORKSPACE_LEFT_PANEL_STORAGE_KEY, String(isLeftRailCollapsed));
  }, [isLeftRailCollapsed]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(WORKSPACE_RIGHT_PANEL_STORAGE_KEY, String(isRightSidebarCollapsed));
  }, [isRightSidebarCollapsed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(WORKSPACE_TOP_BAR_STORAGE_KEY, String(isTopBarCollapsed));
  }, [isTopBarCollapsed]);

  useEffect(() => {
    if (selectedNodeIds.length > 0 && !isTopBarCollapsed) {
      setIsTopBarCollapsed(true);
    }
  }, [selectedNodeIds.length, isTopBarCollapsed]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(WORKSPACE_HINTS_STORAGE_KEY, String(showCanvasHints));
  }, [showCanvasHints]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(WORKSPACE_DEFAULT_STYLE_STORAGE_KEY, JSON.stringify(defaultNodeStyles));
  }, [defaultNodeStyles]);

  useEffect(() => {
    if (selectedConnection && !flowChart.connections.some((connection) => connection.id === selectedConnection)) {
      setSelectedConnection(null);
    }
  }, [flowChart.connections, selectedConnection]);

  useEffect(() => {
    if (flowChart.nodes.length && showCanvasHints) {
      setShowCanvasHints(false);
    }
  }, [flowChart.nodes.length, showCanvasHints]);

  useEffect(() => {
    dragConnectorRef.current = dragConnector;
  }, [dragConnector]);

  useEffect(() => {
    setSelectedNodeIds((previous) => {
      const next = previous.filter((nodeId) => flowChart.nodes.some((node) => node.id === nodeId));

      if (next.length !== previous.length) {
        setSelectedNode(next[next.length - 1] ?? null);
      }

      return next;
    });
  }, [flowChart.nodes, setSelectedNode]);

  const syncViewportState = useCallback(() => {
    const viewport = workspaceViewportRef.current;

    if (!viewport) {
      return;
    }

    setViewportState({
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
      width: viewport.clientWidth,
      height: viewport.clientHeight
    });
  }, []);

  useEffect(() => {
    syncViewportState();
  }, [syncViewportState, zoom, flowChart.nodes.length]);

  useEffect(() => {
    window.addEventListener('resize', syncViewportState);

    return () => {
      window.removeEventListener('resize', syncViewportState);
    };
  }, [syncViewportState]);

  const clearSelection = useCallback(() => {
    setSelectedNodeIds([]);
    setSelectedNode(null);
    setSelectedConnection(null);
    setDragConnector(null);
    setConnectorQuickAdd(null);
  }, [setSelectedNode]);

  const setNodeSelection = useCallback((nodeIds: string[], primaryId?: string | null) => {
    const existingIds = new Set(flowChart.nodes.map((node) => node.id));
    const uniqueNodeIds = Array.from(new Set(nodeIds)).filter((nodeId) => existingIds.has(nodeId));
    const resolvedPrimaryId =
      primaryId && uniqueNodeIds.includes(primaryId) ? primaryId : uniqueNodeIds[uniqueNodeIds.length - 1] ?? null;

    setSelectedNodeIds(uniqueNodeIds);
    setSelectedNode(resolvedPrimaryId);
    setSelectedConnection(null);
  }, [flowChart.nodes, setSelectedNode]);

  const getWorkspacePoint = useCallback((clientX: number, clientY: number): Position => {
    const rect = canvasRef.current?.getBoundingClientRect();

    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: Math.max(0, (clientX - rect.left) / zoomRef.current),
      y: Math.max(0, (clientY - rect.top) / zoomRef.current)
    };
  }, []);

  const commitSelectionBox = useCallback((box: SelectionBoxState) => {
    const normalized = normalizeSelectionBox(box);

    if (normalized.width < 8 && normalized.height < 8) {
      if (!box.additive) {
        clearSelection();
      }
      return;
    }

    const intersectingNodeIds = flowChart.nodes
      .filter((node) =>
        rectanglesIntersect(
          normalized,
          {
            x: node.position.x,
            y: node.position.y,
            width: node.width,
            height: node.height
          }
        )
      )
      .map((node) => node.id);

    if (box.additive) {
      setNodeSelection(
        [...selectedNodeIds, ...intersectingNodeIds],
        intersectingNodeIds[intersectingNodeIds.length - 1] ?? selectedNodeIds[selectedNodeIds.length - 1] ?? null
      );
      return;
    }

    setNodeSelection(intersectingNodeIds, intersectingNodeIds[intersectingNodeIds.length - 1] ?? null);
  }, [clearSelection, flowChart.nodes, selectedNodeIds, setNodeSelection]);

  const snapshotSelection = useCallback((): ClipboardSelection | null => {
    if (!selectedNodeIds.length) {
      return null;
    }

    const selectedNodeIdSet = new Set(selectedNodeIds);

    return {
      nodes: flowChart.nodes
        .filter((node) => selectedNodeIdSet.has(node.id))
        .map((node) => ({
          ...node,
          position: { ...node.position },
          style: node.style ? { ...node.style } : undefined
        })),
      connections: flowChart.connections
        .filter((connection) => selectedNodeIdSet.has(connection.from) && selectedNodeIdSet.has(connection.to))
        .map((connection) => ({
          ...connection,
          waypoints: connection.waypoints?.map((point) => ({ ...point }))
        }))
    };
  }, [flowChart.connections, flowChart.nodes, selectedNodeIds]);

  const copySelectionToClipboard = useCallback(async () => {
    const snapshot = snapshotSelection();

    if (!snapshot) {
      return;
    }

    clipboardSelectionRef.current = snapshot;

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('flowchart-clipboard', JSON.stringify({ kind: 'flowchart-selection', snapshot }));
      }
      await navigator.clipboard.writeText(JSON.stringify({ kind: 'flowchart-selection', snapshot }));
    } catch {
      // Ignore clipboard write failures and keep the local clipboard fallback.
    }
  }, [snapshotSelection]);

  const pasteSelection = useCallback(async (source?: ClipboardSelection | null) => {
    let snapshot = source ?? clipboardSelectionRef.current;

    if (!snapshot) {
      try {
        const rawText = await navigator.clipboard.readText();
        const parsed = JSON.parse(rawText) as unknown;

        if (
          parsed &&
          typeof parsed === 'object' &&
          'kind' in parsed &&
          parsed.kind === 'flowchart-selection' &&
          'snapshot' in parsed
        ) {
          const candidate = parsed.snapshot as ClipboardSelection;
          if (Array.isArray(candidate.nodes) && Array.isArray(candidate.connections)) {
            snapshot = candidate;
          }
        }
      } catch {
        if (typeof window !== 'undefined') {
          try {
            const localRaw = window.localStorage.getItem('flowchart-clipboard');
            if (localRaw) {
              const parsed = JSON.parse(localRaw) as unknown;
              if (
                parsed &&
                typeof parsed === 'object' &&
                'kind' in parsed &&
                parsed.kind === 'flowchart-selection' &&
                'snapshot' in parsed
              ) {
                const candidate = parsed.snapshot as ClipboardSelection;
                if (Array.isArray(candidate.nodes) && Array.isArray(candidate.connections)) {
                  snapshot = candidate;
                }
              }
            }
          } catch {
            snapshot = null;
          }
        } else {
          snapshot = null;
        }
      }
    }

    if (!snapshot?.nodes.length) {
      return;
    }

    pasteCountRef.current += 1;

    const bounds = getNodeBounds(snapshot.nodes);
    const viewport = workspaceViewportRef.current;
    const targetPosition = snapPosition({
      x: viewport ? (viewport.scrollLeft + viewport.clientWidth / 2) / zoomRef.current - 70 : 520,
      y: viewport ? (viewport.scrollTop + viewport.clientHeight / 2) / zoomRef.current - 40 : 360
    });
    const offsetX = targetPosition.x - bounds.minX + PASTE_OFFSET * (pasteCountRef.current - 1);
    const offsetY = targetPosition.y - bounds.minY + PASTE_OFFSET * (pasteCountRef.current - 1);
    const nodeIdMap = new Map<string, string>();
    const groupIdMap = new Map<string, string>();
    const nextNodes = snapshot.nodes.map((node) => {
      const nextId = createId('node');
      nodeIdMap.set(node.id, nextId);

      const nextGroupId = node.groupId
        ? groupIdMap.get(node.groupId) ?? (() => {
            const created = createId('group');
            groupIdMap.set(node.groupId!, created);
            return created;
          })()
        : undefined;

      return {
        ...node,
        id: nextId,
        position: snapPosition({
          x: node.position.x + offsetX,
          y: node.position.y + offsetY
        }),
        style: node.style ? { ...node.style } : undefined,
        groupId: nextGroupId,
        zIndex: undefined
      };
    });
    const nextConnections = snapshot.connections.flatMap((connection) => {
      const from = nodeIdMap.get(connection.from);
      const to = nodeIdMap.get(connection.to);

      if (!from || !to) {
        return [];
      }

      return [
        {
          ...connection,
          id: createId('connection'),
          from,
          to,
          waypoints: connection.waypoints?.map((point) => ({
            x: point.x + offsetX,
            y: point.y + offsetY
          }))
        }
      ];
    });

    transformFlowChart((prev) => ({
      ...prev,
      nodes: [
        ...prev.nodes,
        ...nextNodes.map((node, index) => ({
          ...node,
          zIndex: getNextNodeZIndex(prev.nodes) + index
        }))
      ],
      connections: [...prev.connections, ...nextConnections],
      updatedAt: new Date()
    }));
    setNodeSelection(nextNodes.map((node) => node.id), nextNodes[nextNodes.length - 1]?.id ?? null);
    scheduleScrollToNodes(nextNodes);
  }, [scheduleScrollToNodes, setNodeSelection, transformFlowChart]);

  const handleManualSave = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');
      await persistFlowchart();
      setJustSaved(true);

      if (saveStatusTimeoutRef.current) {
        window.clearTimeout(saveStatusTimeoutRef.current);
      }

      saveStatusTimeoutRef.current = window.setTimeout(() => setJustSaved(false), 2000);
    } catch (error) {
      console.error('Save failed:', error);
      setErrorMessage(getErrorMessage(error, 'Failed to save this flowchart.'));
    } finally {
      setIsSaving(false);
    }
  }, [id, persistFlowchart]);

  const handleCanvasClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (selectionStartedRef.current) {
      selectionStartedRef.current = false;
      return;
    }

    if (e.target === e.currentTarget) {
      setConnectorQuickAdd(null);
      clearSelection();
    }
  };

  const handleCanvasDoubleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && canvasRef.current) {
      setConnectorQuickAdd(null);
      const position = snapPosition({
        x: getWorkspacePoint(e.clientX, e.clientY).x - 70,
        y: getWorkspacePoint(e.clientX, e.clientY).y - 40
      });

      const nextId = addNodeAtPosition(lastUsedNodeType, position);
      setNodeSelection([nextId], nextId);
    }
  };

  const handleCanvasMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || isSpacePressed || e.target !== e.currentTarget) {
      return;
    }

    setConnectorQuickAdd(null);
    closeCommandMenu();

    const origin = getWorkspacePoint(e.clientX, e.clientY);
    selectionOriginRef.current = origin;
    selectionStartedRef.current = false;
    const initialSelection = {
      x: origin.x,
      y: origin.y,
      width: 0,
      height: 0,
      additive: e.shiftKey || e.metaKey || e.ctrlKey
    };
    selectionBoxRef.current = initialSelection;
    setSelectionBox(initialSelection);

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const current = getWorkspacePoint(moveEvent.clientX, moveEvent.clientY);
      const nextSelection = {
        x: origin.x,
        y: origin.y,
        width: current.x - origin.x,
        height: current.y - origin.y,
        additive: e.shiftKey || e.metaKey || e.ctrlKey
      };

      if (Math.abs(nextSelection.width) > 4 || Math.abs(nextSelection.height) > 4) {
        selectionStartedRef.current = true;
      }

      selectionBoxRef.current = nextSelection;
      setSelectionBox(nextSelection);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      if (selectionBoxRef.current) {
        commitSelectionBox(selectionBoxRef.current);
      } else {
        commitSelectionBox({
          x: origin.x,
          y: origin.y,
          width: 0,
          height: 0,
          additive: e.shiftKey || e.metaKey || e.ctrlKey
        });
      }

      setSelectionBox(null);
      selectionBoxRef.current = null;
      selectionOriginRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const closeCommandMenu = useCallback(() => {
    setIsCommandMenuOpen(false);
    setCommandMenuQuery('');
  }, []);

  const updateDragConnectorTarget = useCallback((fromNodeId: string, fromSide: NodeSide, clientX: number, clientY: number) => {
    const pointer = getWorkspacePoint(clientX, clientY);
    const targetNode = getNodeAtPoint(flowChart.nodes, pointer, fromNodeId);
    const nextState: DragConnectorState = {
      fromNodeId,
      fromSide,
      pointer,
      targetNodeId: targetNode?.id ?? null,
      targetSide: targetNode ? getClosestNodeSide(targetNode, pointer) : null
    };

    dragConnectorRef.current = nextState;
    setDragConnector(nextState);
  }, [flowChart.nodes, getWorkspacePoint]);

  const handleConnectorQuickAddOpen = useCallback((options: ConnectorQuickAddState) => {
    setConnectorQuickAdd(options);
    setSelectedConnection(null);
  }, []);

  const createNodeDraft = useCallback((type: FlowChartNode['type'], position: Position, overrides?: Partial<FlowChartNode>): FlowChartNode => {
    const defaultStyle = defaultNodeStyles[type];

    const draft: FlowChartNode = {
      id: overrides?.id ?? createId('node'),
      type,
      position: snapPosition(position),
      text: overrides?.text ?? getDefaultText(type),
      width: overrides?.width ?? getDefaultWidth(type),
      height: overrides?.height ?? getDefaultHeight(type),
    };

    if (defaultStyle || overrides?.style) {
      draft.style = {
        ...(defaultStyle ?? {}),
        ...(overrides?.style ?? {})
      };
    }

    if (overrides?.zIndex !== undefined) draft.zIndex = overrides.zIndex;
    if (overrides?.groupId !== undefined) draft.groupId = overrides.groupId;
    if (overrides?.locked !== undefined) draft.locked = overrides.locked;

    return draft;
  }, [defaultNodeStyles]);

  const handleConnectStart = useCallback((nodeId: string, side: NodeSide, clientPoint: { clientX: number; clientY: number }) => {
    const sourceNode = flowChart.nodes.find((node) => node.id === nodeId);

    if (!sourceNode || sourceNode.locked) {
      return;
    }

    setConnectorQuickAdd(null);
    setSelectedConnection(null);
    updateDragConnectorTarget(nodeId, side, clientPoint.clientX, clientPoint.clientY);

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      updateDragConnectorTarget(nodeId, side, moveEvent.clientX, moveEvent.clientY);
    };

    const handleMouseUp = (upEvent: globalThis.MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      updateDragConnectorTarget(nodeId, side, upEvent.clientX, upEvent.clientY);
      const latestDragConnector = dragConnectorRef.current;
      dragConnectorRef.current = null;
      setDragConnector(null);

      if (!latestDragConnector) {
        return;
      }

      if (
        latestDragConnector.targetNodeId &&
        latestDragConnector.targetSide &&
        latestDragConnector.targetNodeId !== nodeId
      ) {
        addConnection(nodeId, latestDragConnector.targetNodeId, side, latestDragConnector.targetSide);
        return;
      }

      handleConnectorQuickAddOpen({
        fromNodeId: nodeId,
        fromSide: side,
        position: latestDragConnector.pointer,
        title: sourceNode ? `Create the next block from ${sourceNode.text}` : 'Create the next connected block'
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [addConnection, flowChart.nodes, handleConnectorQuickAddOpen, updateDragConnectorTarget]);

  function handleCreateNodeFromConnector(type: FlowChartNode['type']) {
    if (!connectorQuickAdd) {
      return;
    }

    const width = getDefaultWidth(type);
    const height = getDefaultHeight(type);
    const nextNodeId = createId('node');
    const nextNode = createNodeDraft(type, {
      x: Math.max(48, connectorQuickAdd.position.x - width / 2),
      y: Math.max(48, connectorQuickAdd.position.y - height / 2)
    }, {
      id: nextNodeId,
      width,
      height
    });
    const nextConnection: Connection = {
      id: createId('connection'),
      from: connectorQuickAdd.fromNodeId,
      to: nextNodeId,
      fromSide: connectorQuickAdd.fromSide,
      toSide: getOppositeSide(connectorQuickAdd.fromSide),
      type: 'curved',
      startMarker: 'none',
      endMarker: 'arrow',
      labelPosition: 0.5
    };

    transformFlowChart((prev) => ({
      ...prev,
      nodes: [...prev.nodes, { ...nextNode, zIndex: getNextNodeZIndex(prev.nodes) }],
      connections: [...prev.connections, nextConnection],
      updatedAt: new Date()
    }));
    setConnectorQuickAdd(null);
    setNodeSelection([nextNodeId], nextNodeId);
    setLastUsedNodeType(type);
    setShowCanvasHints(false);
  }

  const handleExport = useCallback(async (format: 'png' | 'svg' | 'json' | 'pdf', options?: { transparent?: boolean }) => {
    switch (format) {
      case 'json': {
        const exportData = { ...flowChart, name: flowchartName };
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        downloadBlob(dataBlob, `${flowchartName.replace(/\s+/g, '_').trim() || 'flowchart'}.json`);
        break;
      }
      case 'svg': {
        const snapshot = buildFlowchartExport(flowChart.nodes, flowChart.connections, { transparent: options?.transparent });
        const svgBlob = new Blob([snapshot.svg], { type: 'image/svg+xml;charset=utf-8' });
        downloadBlob(svgBlob, `${flowchartName.replace(/\s+/g, '_').trim() || 'flowchart'}.svg`);
        break;
      }
      case 'png': {
        const snapshot = buildFlowchartExport(flowChart.nodes, flowChart.connections, { transparent: options?.transparent });
        const pngDataUrl = await svgToPngDataUrl(snapshot.svg, snapshot.width, snapshot.height);
        const pngBlob = await fetch(pngDataUrl).then((response) => response.blob());
        downloadBlob(pngBlob, `${flowchartName.replace(/\s+/g, '_').trim() || 'flowchart'}.png`);
        break;
      }
      case 'pdf': {
        const snapshot = buildFlowchartExport(flowChart.nodes, flowChart.connections);
        const pngDataUrl = await svgToPngDataUrl(snapshot.svg, snapshot.width, snapshot.height);
        const { jsPDF } = await import('jspdf');
        const orientation = snapshot.width >= snapshot.height ? 'landscape' : 'portrait';
        const pdf = new jsPDF({
          orientation,
          unit: 'pt',
          format: [snapshot.width, snapshot.height]
        });
        pdf.addImage(pngDataUrl, 'PNG', 0, 0, snapshot.width, snapshot.height);
        pdf.save(`${flowchartName.replace(/\s+/g, '_').trim() || 'flowchart'}.pdf`);
        break;
      }
    }
  }, [flowChart, flowchartName]);

  const handleImport = (file: File) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const importedFlowchart = parseImportedFlowChart(event.target?.result, flowchartName);
        const { nodes: positionedNodes, connections: positionedConnections } = applyWorkspacePadding(
          importedFlowchart.nodes,
          importedFlowchart.connections
        );

        replaceFlowChartContent({
          name: importedFlowchart.name,
          nodes: positionedNodes,
          connections: positionedConnections
        });
        setFlowchartName(importedFlowchart.name);
        setSelectedConnection(null);
        setDragConnector(null);
        setConnectorQuickAdd(null);
        setErrorMessage('');
        setShowCanvasHints(false);
        scheduleScrollToNodes(positionedNodes);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, 'Invalid file format. Please select a valid JSON file.'));
      }
    };

    reader.readAsText(file);
  };

  const handleAIGenerate = async () => {
    if (!aiDescription.trim() || isGenerating) {
      return;
    }

    setIsGenerating(true);

    try {
      setErrorMessage('');
      const result = await aiService.generateFlowChart({
        description: aiDescription,
        style: 'simple'
      });

      const generatedFlowchart = materializeAIFlowChart(result);
      replaceFlowChartContent(generatedFlowchart);
      setSelectedConnection(null);
      setDragConnector(null);
      setConnectorQuickAdd(null);
      setShowCanvasHints(false);
      scheduleScrollToNodes(generatedFlowchart.nodes);

      if (!flowChart.nodes.length || flowchartName === 'Untitled Flowchart') {
        setFlowchartName(result.title);
      }

      setAiDescription('');
    } catch (error) {
      console.error('AI generation failed:', error);
      setErrorMessage(getErrorMessage(error, 'Failed to generate a flowchart. Please try again.'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearAll = () => {
    clearAll();
    setSelectedNodeIds([]);
    setSelectedConnection(null);
    setDragConnector(null);
    setConnectorQuickAdd(null);
    scheduleScrollToNodes([]);
  };

  const addNodeAtPosition = useCallback((type: FlowChartNode['type'], position: Position, overrides?: Partial<FlowChartNode>) => {
    const node = createNodeDraft(type, position, overrides);
    setLastUsedNodeType(type);
    setShowCanvasHints(false);

    transformFlowChart((prev) => ({
      ...prev,
      nodes: [
        ...prev.nodes,
        {
          ...node,
          zIndex: getNextNodeZIndex(prev.nodes)
        }
      ],
      updatedAt: new Date()
    }));

    return node.id;
  }, [createNodeDraft, transformFlowChart]);

  const getSuggestedNodePosition = useCallback((): Position => {
    const viewport = workspaceViewportRef.current;
    const column = flowChart.nodes.length % 3;
    const row = Math.floor((flowChart.nodes.length % 6) / 3);
    const viewportCenterX = viewport
      ? (viewport.scrollLeft + viewport.clientWidth / 2) / zoomRef.current
      : 520;
    const viewportCenterY = viewport
      ? (viewport.scrollTop + viewport.clientHeight / 2) / zoomRef.current
      : 360;

    return snapPosition({
      x: Math.max(96, Math.round(viewportCenterX - 70 + (column - 1) * 190)),
      y: Math.max(96, Math.round(viewportCenterY - 40 + (row - 0.5) * 150))
    });
  }, [flowChart.nodes.length]);

  const addNodeFromPalette = useCallback((type: FlowChartNode['type']) => {
    const nextId = addNodeAtPosition(type, getSuggestedNodePosition());
    setNodeSelection([nextId], nextId);
  }, [addNodeAtPosition, getSuggestedNodePosition, setNodeSelection]);

  function saveSelectedNodeStyleAsDefault() {
    if (!selectedNodeData?.style) {
      return;
    }

    setDefaultNodeStyles((previous) => ({
      ...previous,
      [selectedNodeData.type]: { ...selectedNodeData.style }
    }));
  }

  const focusAIComposer = useCallback(() => {
    aiTextareaRef.current?.focus();
    aiTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const nodeTypes: WorkspaceNodeType[] = [
    {
      type: 'start' as const,
      icon: Play,
      label: 'Start',
      description: 'Kick off the flow.',
      iconColor: 'text-emerald-600',
      surfaceClass: 'border-emerald-200 bg-emerald-50'
    },
    {
      type: 'process' as const,
      icon: Square,
      label: 'Process',
      description: 'Capture a core step.',
      iconColor: 'text-sky-600',
      surfaceClass: 'border-sky-200 bg-sky-50'
    },
    {
      type: 'decision' as const,
      icon: Diamond,
      label: 'Decision',
      description: 'Branch the path.',
      iconColor: 'text-amber-600',
      surfaceClass: 'border-amber-200 bg-amber-50'
    },
    {
      type: 'connector' as const,
      icon: Circle,
      label: 'Connector',
      description: 'Link distant ideas.',
      iconColor: 'text-violet-600',
      surfaceClass: 'border-violet-200 bg-violet-50'
    },
    {
      type: 'input' as const,
      icon: Square,
      label: 'Input / Output',
      description: 'Capture user input or output.',
      iconColor: 'text-sky-600',
      surfaceClass: 'border-sky-200 bg-sky-50'
    },
    {
      type: 'manualInput' as const,
      icon: Square,
      label: 'Manual Input',
      description: 'Show keyboard or human entry.',
      iconColor: 'text-fuchsia-600',
      surfaceClass: 'border-fuchsia-200 bg-fuchsia-50'
    },
    {
      type: 'manualOperation' as const,
      icon: Square,
      label: 'Manual Operation',
      description: 'Represent a manual action.',
      iconColor: 'text-orange-600',
      surfaceClass: 'border-orange-200 bg-orange-50'
    },
    {
      type: 'triangle' as const,
      icon: Triangle,
      label: 'Triangle',
      description: 'Add a directional marker.',
      iconColor: 'text-slate-600',
      surfaceClass: 'border-slate-200 bg-slate-50'
    },
    {
      type: 'hexagon' as const,
      icon: Hexagon,
      label: 'Hexagon',
      description: 'Preparation or setup state.',
      iconColor: 'text-cyan-600',
      surfaceClass: 'border-cyan-200 bg-cyan-50'
    },
    {
      type: 'database' as const,
      icon: Database,
      label: 'Database',
      description: 'Store or retrieve data.',
      iconColor: 'text-indigo-600',
      surfaceClass: 'border-indigo-200 bg-indigo-50'
    },
    {
      type: 'annotation' as const,
      icon: Square,
      label: 'Annotation',
      description: 'Add context and notes.',
      iconColor: 'text-slate-600',
      surfaceClass: 'border-slate-200 bg-white'
    },
    {
      type: 'end' as const,
      icon: StopSquare,
      label: 'End',
      description: 'Close the journey.',
      iconColor: 'text-rose-600',
      surfaceClass: 'border-rose-200 bg-rose-50'
    }
  ];
  const toolRailNodeTypes = nodeTypes.filter((nodeType) =>
    ['start', 'process', 'decision', 'connector', 'end'].includes(nodeType.type)
  );
  const connectorQuickAddItems = nodeTypes.filter((nodeType) =>
    ['process', 'decision', 'end', 'annotation'].includes(nodeType.type)
  );

  const starterPrompts = [
    'Customer onboarding from signup to activation',
    'Bug triage workflow for a product team',
    'Order fulfillment with payment, packing, and shipping',
    'Hiring pipeline from application to offer'
  ];
  const commandMenuItems: CommandMenuItem[] = [
    ...nodeTypes.map((nodeType) => ({
      id: `add-${nodeType.type}`,
      title: `Add ${nodeType.label}`,
      description: nodeType.description,
      shortcut:
        nodeType.type === 'process'
          ? 'R'
          : nodeType.type === 'decision'
            ? 'D'
            : nodeType.type === 'connector'
              ? 'O'
              : nodeType.type === 'annotation'
                ? 'L'
                : nodeType.type === 'triangle'
                  ? 'T'
                  : undefined
    })),
    {
      id: 'fit-canvas',
      title: 'Fit board to screen',
      description: 'Frame the current flowchart in the viewport.',
      shortcut: 'Fit'
    },
    {
      id: 'fit-selection',
      title: 'Fit selection',
      description: 'Frame the selected nodes in the viewport.',
      shortcut: 'F'
    },
    {
      id: 'align-left',
      title: 'Align left',
      description: 'Align selected nodes to the left edge.'
    },
    {
      id: 'align-top',
      title: 'Align top',
      description: 'Align selected nodes to the top edge.'
    },
    {
      id: 'distribute-horizontal',
      title: 'Distribute horizontally',
      description: 'Space selected nodes evenly across the row.'
    },
    {
      id: 'distribute-vertical',
      title: 'Distribute vertically',
      description: 'Space selected nodes evenly down the column.'
    },
    {
      id: 'tidy-selection',
      title: 'Tidy selection',
      description: 'Arrange selected nodes into a cleaner grid.'
    },
    {
      id: 'group-selection',
      title: 'Group selection',
      description: 'Keep the selected nodes together.'
    },
    {
      id: 'ungroup-selection',
      title: 'Ungroup selection',
      description: 'Break the selected group apart.'
    },
    {
      id: 'bring-front',
      title: 'Bring selection forward',
      description: 'Raise selected nodes above others.'
    },
    {
      id: 'send-back',
      title: 'Send selection backward',
      description: 'Push selected nodes behind others.'
    },
    {
      id: flowChart.nodes.some((node) => selectedNodeIds.includes(node.id) && node.locked)
        ? 'unlock-selection'
        : 'lock-selection',
      title: flowChart.nodes.some((node) => selectedNodeIds.includes(node.id) && node.locked)
        ? 'Unlock selection'
        : 'Lock selection',
      description: 'Prevent selected nodes from moving or editing until they are unlocked.'
    },
    {
      id: 'reset-route',
      title: 'Reset connector route',
      description: 'Return the selected connection to its automatic route.'
    },
    {
      id: 'toggle-left-panel',
      title: isLeftRailCollapsed ? 'Show left tools' : 'Hide left tools',
      description: 'Collapse or expand the quick-add tool rail.'
    },
    {
      id: 'toggle-right-panel',
      title: isRightSidebarCollapsed ? 'Show right inspector' : 'Hide right inspector',
      description: 'Collapse or expand the AI and inspector sidebar.'
    },
    {
      id: 'toggle-hints',
      title: showCanvasHints ? 'Hide canvas hints' : 'Show canvas hints',
      description: 'Reduce or restore the canvas helper overlays.'
    },
    {
      id: 'focus-ai',
      title: 'Focus AI composer',
      description: 'Jump straight to the AI prompt field.',
      shortcut: '/'
    },
    {
      id: 'toggle-theme',
      title: workspaceTheme === 'dark' ? 'Switch to light workspace' : 'Switch to dark workspace',
      description: 'Change the board canvas theme.',
      shortcut: 'Theme'
    },
    {
      id: 'export-png',
      title: 'Export PNG',
      description: 'Download the current board as an image.'
    },
    {
      id: 'export-svg',
      title: 'Export SVG',
      description: 'Download the current board as SVG.'
    },
    {
      id: 'export-pdf',
      title: 'Export PDF',
      description: 'Download the current board as PDF.'
    }
  ];

  const selectedNodeData =
    selectedNodeIds.length === 1
      ? flowChart.nodes.find((node) => node.id === selectedNodeIds[0]) ?? null
      : null;
  const selectedNodesData = useMemo(
    () => flowChart.nodes.filter((node) => selectedNodeIds.includes(node.id)),
    [flowChart.nodes, selectedNodeIds]
  );
  const selectedConnectionData =
    flowChart.connections.find((connection) => connection.id === selectedConnection) ?? null;
  const hasLockedSelection = selectedNodesData.some((node) => Boolean(node.locked));
  const allSelectedNodesLocked = selectedNodesData.length > 0 && selectedNodesData.every((node) => Boolean(node.locked));
  const canUngroupSelection =
    selectedNodesData.length > 1 && selectedNodesData.every((node) => Boolean(node.groupId));
  const selectedConnectionEndpoints = useMemo(() => (
    selectedConnectionData
      ? {
          from: flowChart.nodes.find((node) => node.id === selectedConnectionData.from) ?? null,
          to: flowChart.nodes.find((node) => node.id === selectedConnectionData.to) ?? null
        }
      : null
  ), [flowChart.nodes, selectedConnectionData]);
  const selectedConnectionGeometry = useMemo(() => (
    selectedConnectionData && selectedConnectionEndpoints?.from && selectedConnectionEndpoints.to
      ? buildConnectionGeometry({
          connection: selectedConnectionData,
          fromNode: selectedConnectionEndpoints.from,
          toNode: selectedConnectionEndpoints.to,
          obstacleNodes: flowChart.nodes.filter(
            (node) => node.id !== selectedConnectionData.from && node.id !== selectedConnectionData.to
          )
        })
      : null
  ), [flowChart.nodes, selectedConnectionData, selectedConnectionEndpoints]);
  const connectingNodeLabel = dragConnector
    ? flowChart.nodes.find((node) => node.id === dragConnector.fromNodeId)?.text || 'this node'
    : null;
  const workspaceMetrics = getWorkspaceMetrics(flowChart.nodes);
  const dragConnectorPreview = dragConnector
    ? (() => {
        const fromNode = flowChart.nodes.find((node) => node.id === dragConnector.fromNodeId);

        if (!fromNode) {
          return null;
        }

        const fromPoint = getNodeConnectionPoint(fromNode, dragConnector.fromSide);
        const toPoint =
          dragConnector.targetNodeId && dragConnector.targetSide
            ? getNodeConnectionPoint(
                flowChart.nodes.find((node) => node.id === dragConnector.targetNodeId) ?? fromNode,
                dragConnector.targetSide
              )
            : dragConnector.pointer;

        return {
          path: buildPreviewConnectionPath(fromPoint, toPoint, dragConnector.fromSide, dragConnector.targetSide ?? dragConnector.fromSide),
          targetPoint: toPoint
        };
      })()
    : null;
  const zoomLabel = `${Math.round(zoom * 100)}%`;
  const isDarkWorkspace = workspaceTheme === 'dark';
  const gridPatternId = `workspace-grid-${workspaceTheme}`;
  const shellClass = isDarkWorkspace ? 'bg-[#101114] text-slate-100' : 'bg-[#efe8dc] text-slate-900';
  const mainClass = isDarkWorkspace ? 'bg-[#18191d]' : 'bg-[#ede7dc]';
  const canvasShellClass = isDarkWorkspace ? 'bg-[#1a1b1f]' : 'bg-[#e8e0d2]';
  const loadingShellClass = isDarkWorkspace
    ? 'bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_26%),linear-gradient(180deg,#111318_0%,#16181d_100%)]'
    : 'bg-[radial-gradient(circle_at_top_left,rgba(255,190,118,0.2),transparent_26%),linear-gradient(180deg,#f9f6ef_0%,#f4f1e8_100%)]';
  const loadingCardClass = isDarkWorkspace
    ? 'border-white/10 bg-[#1b1c20]/92 shadow-[0_24px_90px_-48px_rgba(0,0,0,0.6)]'
    : 'border-white/80 bg-white/90 shadow-[0_24px_90px_-48px_rgba(15,23,42,0.42)]';
  const workspaceBackground = isDarkWorkspace
    ? 'radial-gradient(circle at 18% 18%, rgba(56,189,248,0.07), transparent 24%), radial-gradient(circle at 82% 14%, rgba(99,102,241,0.06), transparent 26%), radial-gradient(circle at 58% 82%, rgba(16,185,129,0.05), transparent 28%), linear-gradient(180deg, #1b1c20 0%, #15161a 100%)'
    : 'radial-gradient(circle at 14% 16%, rgba(251,191,36,0.14), transparent 22%), radial-gradient(circle at 82% 18%, rgba(56,189,248,0.12), transparent 24%), radial-gradient(circle at 58% 80%, rgba(16,185,129,0.1), transparent 28%), linear-gradient(180deg, #f7f3ea 0%, #efe8db 100%)';
  const workspaceGridStroke = isDarkWorkspace ? 'rgba(255, 255, 255, 0.045)' : 'rgba(148, 163, 184, 0.18)';
  const nodeToolbarPosition = selectedNodeData
    ? projectWorkspacePoint(
        {
          x: selectedNodeData.position.x + selectedNodeData.width / 2,
          y: selectedNodeData.position.y - 28
        },
        viewportState,
        zoom
      )
    : null;
  const multiToolbarPosition =
    selectedNodeIds.length > 1 && selectedNodesData.length
      ? projectWorkspacePoint(
          {
            x: selectedNodesData.reduce((sum, node) => sum + node.position.x + node.width / 2, 0) / selectedNodesData.length,
            y: getNodeBounds(selectedNodesData).minY - 28
          },
          viewportState,
          zoom
        )
      : null;
  const connectionToolbarPosition =
    selectedConnectionGeometry
      ? projectWorkspacePoint(
          selectedConnectionGeometry.labelPoint,
          viewportState,
          zoom
        )
      : null;
  const quickAddOverlayPosition = connectorQuickAdd
    ? projectWorkspacePoint(connectorQuickAdd.position, viewportState, zoom)
    : null;

  const openQuickAddFromNode = useCallback((node: FlowChartNode, side: NodeSide = 'right') => {
    if (node.locked) {
      return;
    }

    handleConnectorQuickAddOpen({
      fromNodeId: node.id,
      fromSide: side,
      position: getQuickAddDropPoint(node, side),
      title: `Add the next block from ${node.text}`
    });
  }, [handleConnectorQuickAddOpen]);

  const openQuickAddFromConnection = useCallback(() => {
    if (!selectedConnectionData || !selectedConnectionEndpoints?.to || selectedConnectionEndpoints.to.locked) {
      return;
    }

    const expansionSide = getPreferredExpansionSide(selectedConnectionData.toSide);
    handleConnectorQuickAddOpen({
      fromNodeId: selectedConnectionData.to,
      fromSide: expansionSide,
      position: getQuickAddDropPoint(selectedConnectionEndpoints.to, expansionSide),
      title: `Continue from ${selectedConnectionEndpoints.to.text}`
    });
  }, [handleConnectorQuickAddOpen, selectedConnectionData, selectedConnectionEndpoints]);

  const handleDuplicateSelectedNode = useCallback(() => {
    if (!selectedNodeData) {
      return;
    }

    clipboardSelectionRef.current = {
      nodes: [
        {
          ...selectedNodeData,
          position: { ...selectedNodeData.position },
          style: selectedNodeData.style ? { ...selectedNodeData.style } : undefined
        }
      ],
      connections: []
    };
    void pasteSelection(clipboardSelectionRef.current);
  }, [pasteSelection, selectedNodeData]);

  function handleCommandSelect(item: CommandMenuItem) {
    if (item.id.startsWith('add-')) {
      addNodeFromPalette(item.id.replace('add-', '') as FlowChartNode['type']);
      closeCommandMenu();
      return;
    }

    switch (item.id) {
      case 'fit-canvas':
        scheduleScrollToNodes(flowChart.nodes);
        break;
      case 'fit-selection':
        fitSelection();
        break;
      case 'align-left':
        alignSelection('left');
        break;
      case 'align-top':
        alignSelection('top');
        break;
      case 'distribute-horizontal':
        distributeSelection('horizontal');
        break;
      case 'distribute-vertical':
        distributeSelection('vertical');
        break;
      case 'tidy-selection':
        tidySelection();
        break;
      case 'group-selection':
        groupSelection();
        break;
      case 'ungroup-selection':
        ungroupSelection();
        break;
      case 'bring-front':
        moveSelectionInStack('front');
        break;
      case 'send-back':
        moveSelectionInStack('back');
        break;
      case 'lock-selection':
        setSelectionLocked(true);
        break;
      case 'unlock-selection':
        setSelectionLocked(false);
        break;
      case 'reset-route':
        if (selectedConnectionData) {
          updateConnection(selectedConnectionData.id, { waypoints: undefined });
        }
        break;
      case 'toggle-left-panel':
        setIsLeftRailCollapsed((current) => !current);
        break;
      case 'toggle-right-panel':
        setIsRightSidebarCollapsed((current) => !current);
        break;
      case 'toggle-hints':
        setShowCanvasHints((current) => !current);
        break;
      case 'focus-ai':
        focusAIComposer();
        break;
      case 'toggle-theme':
        setWorkspaceTheme((current) => (current === 'dark' ? 'light' : 'dark'));
        break;
      case 'export-png':
        void handleExport('png');
        break;
      case 'export-svg':
        void handleExport('svg');
        break;
      case 'export-pdf':
        void handleExport('pdf');
        break;
      default:
        break;
    }

    closeCommandMenu();
  }

  const handleWorkspacePanStart = (e: ReactMouseEvent<HTMLDivElement>) => {
    const viewport = workspaceViewportRef.current;
    const isMiddleMouse = e.button === 1;
    const isSpacePan = e.button === 0 && isSpacePressed;

    if (!viewport || (!isMiddleMouse && !isSpacePan)) {
      return;
    }

    e.preventDefault();
    setIsPanning(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startScrollLeft = viewport.scrollLeft;
    const startScrollTop = viewport.scrollTop;

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      viewport.scrollLeft = startScrollLeft - (moveEvent.clientX - startX);
      viewport.scrollTop = startScrollTop - (moveEvent.clientY - startY);
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleWorkspaceWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    if (!(e.ctrlKey || e.metaKey)) {
      return;
    }

    e.preventDefault();
    const nextZoom = e.deltaY > 0 ? zoomRef.current / 1.08 : zoomRef.current * 1.08;
    applyZoom(nextZoom, { clientX: e.clientX, clientY: e.clientY });
  };

  const handleNodeSelect = useCallback((nodeId: string, options?: { additive?: boolean; deep?: boolean }) => {
    const clickedNode = flowChart.nodes.find((node) => node.id === nodeId);
    const groupMemberIds =
      clickedNode?.groupId && !options?.deep
        ? flowChart.nodes.filter((node) => node.groupId === clickedNode.groupId).map((node) => node.id)
        : [nodeId];

    if (options?.additive) {
      setSelectedNodeIds((previous) => {
        const exists = groupMemberIds.every((id) => previous.includes(id));
        const next = exists
          ? previous.filter((id) => !groupMemberIds.includes(id))
          : [...previous, ...groupMemberIds];
        setSelectedNode(next[next.length - 1] ?? null);
        return next;
      });
      setSelectedConnection(null);
      return;
    }

    setNodeSelection(groupMemberIds, nodeId);
  }, [flowChart.nodes, setNodeSelection, setSelectedNode]);

  const handleNodeDragStart = useCallback((nodeId: string) => {
    const clickedNode = flowChart.nodes.find((node) => node.id === nodeId);

    if (!clickedNode || clickedNode.locked) {
      setNodeSelection([nodeId], nodeId);
      return;
    }

    const canDragSelection =
      selectedNodeIds.length > 1 &&
      selectedNodeIds.includes(nodeId) &&
      flowChart.nodes.filter((node) => selectedNodeIds.includes(node.id)).every((node) => !node.locked);
    const activeNodeIds = canDragSelection ? selectedNodeIds : [nodeId];
    const activeNodePositions = Object.fromEntries(
      flowChart.nodes
        .filter((node) => activeNodeIds.includes(node.id))
        .map((node) => [node.id, { ...node.position }])
    );

    dragStartPositionsRef.current = activeNodePositions;

    if (!canDragSelection) {
      setNodeSelection([nodeId], nodeId);
    }

    startDrag(nodeId);
  }, [flowChart.nodes, selectedNodeIds, setNodeSelection, startDrag]);

  const handleNodeDrag = useCallback((delta: Position) => {
    const dragStartPositions = dragStartPositionsRef.current;
    if (!dragStartPositions) return;

    let adjustedDeltaX = delta.x;
    let adjustedDeltaY = delta.y;
    const newGuides: AlignmentGuide[] = [];

    const activeIds = Object.keys(dragStartPositions);
    if (activeIds.length === 1) {
      const nodeId = activeIds[0];
      const origin = dragStartPositions[nodeId];
      const draggedNode = flowChart.nodes.find(n => n.id === nodeId);
      
      if (draggedNode) {
        const rawX = origin.x + delta.x;
        const rawY = origin.y + delta.y;
        
        const SNAP_THRESHOLD = 8;
        const targetCenterX = rawX + draggedNode.width / 2;
        const targetCenterY = rawY + draggedNode.height / 2;
        const targetRightX = rawX + draggedNode.width;
        const targetBottomY = rawY + draggedNode.height;

        let snappedX = false;
        let snappedY = false;

        const otherNodes = flowChart.nodes.filter(n => n.id !== nodeId);

        for (const other of otherNodes) {
          const otherCenterX = other.position.x + other.width / 2;
          const otherCenterY = other.position.y + other.height / 2;
          const otherRightX = other.position.x + other.width;
          const otherBottomY = other.position.y + other.height;

          if (!snappedX) {
            if (Math.abs(rawX - other.position.x) < SNAP_THRESHOLD) {
              adjustedDeltaX = other.position.x - origin.x;
              snappedX = true;
              newGuides.push({ type: 'vertical', position: other.position.x, start: Math.min(rawY, other.position.y), end: Math.max(rawY + draggedNode.height, other.position.y + other.height) });
            } else if (Math.abs(targetCenterX - otherCenterX) < SNAP_THRESHOLD) {
              adjustedDeltaX = otherCenterX - draggedNode.width / 2 - origin.x;
              snappedX = true;
              newGuides.push({ type: 'vertical', position: otherCenterX, start: Math.min(rawY, other.position.y), end: Math.max(rawY + draggedNode.height, other.position.y + other.height) });
            } else if (Math.abs(targetRightX - otherRightX) < SNAP_THRESHOLD) {
              adjustedDeltaX = otherRightX - draggedNode.width - origin.x;
              snappedX = true;
              newGuides.push({ type: 'vertical', position: otherRightX, start: Math.min(rawY, other.position.y), end: Math.max(rawY + draggedNode.height, other.position.y + other.height) });
            } else if (Math.abs(rawX - otherRightX) < SNAP_THRESHOLD) {
              adjustedDeltaX = otherRightX - origin.x;
              snappedX = true;
              newGuides.push({ type: 'vertical', position: otherRightX, start: Math.min(rawY, other.position.y), end: Math.max(rawY + draggedNode.height, other.position.y + other.height) });
            } else if (Math.abs(targetRightX - other.position.x) < SNAP_THRESHOLD) {
              adjustedDeltaX = other.position.x - draggedNode.width - origin.x;
              snappedX = true;
              newGuides.push({ type: 'vertical', position: other.position.x, start: Math.min(rawY, other.position.y), end: Math.max(rawY + draggedNode.height, other.position.y + other.height) });
            }
          }

          if (!snappedY) {
            if (Math.abs(rawY - other.position.y) < SNAP_THRESHOLD) {
              adjustedDeltaY = other.position.y - origin.y;
              snappedY = true;
              newGuides.push({ type: 'horizontal', position: other.position.y, start: Math.min(rawX, other.position.x), end: Math.max(rawX + draggedNode.width, other.position.x + other.width) });
            } else if (Math.abs(targetCenterY - otherCenterY) < SNAP_THRESHOLD) {
              adjustedDeltaY = otherCenterY - draggedNode.height / 2 - origin.y;
              snappedY = true;
              newGuides.push({ type: 'horizontal', position: otherCenterY, start: Math.min(rawX, other.position.x), end: Math.max(rawX + draggedNode.width, other.position.x + other.width) });
            } else if (Math.abs(targetBottomY - otherBottomY) < SNAP_THRESHOLD) {
              adjustedDeltaY = otherBottomY - draggedNode.height - origin.y;
              snappedY = true;
              newGuides.push({ type: 'horizontal', position: otherBottomY, start: Math.min(rawX, other.position.x), end: Math.max(rawX + draggedNode.width, other.position.x + other.width) });
            } else if (Math.abs(rawY - otherBottomY) < SNAP_THRESHOLD) {
              adjustedDeltaY = otherBottomY - origin.y;
              snappedY = true;
              newGuides.push({ type: 'horizontal', position: otherBottomY, start: Math.min(rawX, other.position.x), end: Math.max(rawX + draggedNode.width, other.position.x + other.width) });
            } else if (Math.abs(targetBottomY - other.position.y) < SNAP_THRESHOLD) {
              adjustedDeltaY = other.position.y - draggedNode.height - origin.y;
              snappedY = true;
              newGuides.push({ type: 'horizontal', position: other.position.y, start: Math.min(rawX, other.position.x), end: Math.max(rawX + draggedNode.width, other.position.x + other.width) });
            }
          }
        }
      }
    }

    setAlignmentGuides(newGuides);

    transformFlowChart((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) => {
        const origin = dragStartPositions[node.id];
        if (!origin) return node;

        let newX = origin.x + adjustedDeltaX;
        let newY = origin.y + adjustedDeltaY;

        if (newGuides.length === 0) {
           const snapped = snapPosition({ x: newX, y: newY });
           newX = snapped.x;
           newY = snapped.y;
        }

        return {
          ...node,
          position: { x: newX, y: newY }
        };
      }),
      updatedAt: new Date()
    }), { saveHistory: false });
  }, [transformFlowChart, flowChart.nodes]);

  const handleNodeDragEnd = useCallback(() => {
    dragStartPositionsRef.current = null;
    setAlignmentGuides([]);
    endDrag();
  }, [endDrag]);

  const handleNodeResizeStart = useCallback((nodeId: string) => {
    const node = flowChart.nodes.find((item) => item.id === nodeId);

    if (!node || node.locked) {
      return;
    }

    startDrag(nodeId);
  }, [flowChart.nodes, startDrag]);

  const handleNodeResize = useCallback((nodeId: string, nextBounds: { x: number; y: number; width: number; height: number }) => {
    transformFlowChart((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) =>
        node.id === nodeId && !node.locked
          ? {
              ...node,
              position: snapPosition({ x: nextBounds.x, y: nextBounds.y }),
              width: snapSize(nextBounds.width),
              height: snapSize(nextBounds.height)
            }
          : node
      ),
      updatedAt: new Date()
    }), { saveHistory: false });
  }, [transformFlowChart]);

  const handleNodeResizeEnd = useCallback(() => {
    captureHistorySnapshot();
    endDrag();
  }, [captureHistorySnapshot, endDrag]);

  const handleMinimapNavigate = useCallback((workspaceX: number, workspaceY: number) => {
    const viewport = workspaceViewportRef.current;

    if (!viewport) {
      return;
    }

    viewport.scrollTo({
      left: Math.max(0, workspaceX * zoomRef.current - viewport.clientWidth / 2),
      top: Math.max(0, workspaceY * zoomRef.current - viewport.clientHeight / 2),
      behavior: 'smooth'
    });
  }, []);

  const duplicateSelection = useCallback(() => {
    const snapshot = snapshotSelection();

    if (!snapshot) {
      return;
    }

    clipboardSelectionRef.current = snapshot;
    void pasteSelection(snapshot);
  }, [pasteSelection, snapshotSelection]);

  const selectAllNodes = useCallback(() => {
    setNodeSelection(flowChart.nodes.map((node) => node.id), flowChart.nodes[flowChart.nodes.length - 1]?.id ?? null);
  }, [flowChart.nodes, setNodeSelection]);

  const updateSelectedNodes = useCallback((updater: (nodes: FlowChartNode[]) => FlowChartNode[]) => {
    if (!selectedNodeIds.length) {
      return;
    }

    const selectedIdSet = new Set(selectedNodeIds);

    transformFlowChart((prev) => {
      const selectedNodes = prev.nodes.filter((node) => selectedIdSet.has(node.id) && !node.locked);

      if (!selectedNodes.length) {
        return prev;
      }

      const updatedSelectedNodes = updater(selectedNodes);
      const updatedMap = new Map(updatedSelectedNodes.map((node) => [node.id, node]));

      return {
        ...prev,
        nodes: prev.nodes.map((node) => updatedMap.get(node.id) ?? node),
        updatedAt: new Date()
      };
    });
  }, [selectedNodeIds, transformFlowChart]);

  const alignSelection = useCallback((mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    updateSelectedNodes((nodes) => {
      if (nodes.length < 2) {
        return nodes;
      }

      const bounds = getNodeBounds(nodes);

      return nodes.map((node) => {
        switch (mode) {
          case 'left':
            return { ...node, position: snapPosition({ x: bounds.minX, y: node.position.y }) };
          case 'center':
            return {
              ...node,
              position: snapPosition({ x: bounds.minX + (bounds.maxX - bounds.minX) / 2 - node.width / 2, y: node.position.y })
            };
          case 'right':
            return { ...node, position: snapPosition({ x: bounds.maxX - node.width, y: node.position.y }) };
          case 'top':
            return { ...node, position: snapPosition({ x: node.position.x, y: bounds.minY }) };
          case 'middle':
            return {
              ...node,
              position: snapPosition({ x: node.position.x, y: bounds.minY + (bounds.maxY - bounds.minY) / 2 - node.height / 2 })
            };
          case 'bottom':
            return { ...node, position: snapPosition({ x: node.position.x, y: bounds.maxY - node.height }) };
          default:
            return node;
        }
      });
    });
  }, [updateSelectedNodes]);

  const distributeSelection = useCallback((axis: 'horizontal' | 'vertical') => {
    updateSelectedNodes((nodes) => {
      if (nodes.length < 3) {
        return nodes;
      }

      const sorted = [...nodes].sort((left, right) =>
        axis === 'horizontal' ? left.position.x - right.position.x : left.position.y - right.position.y
      );
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const start = axis === 'horizontal' ? first.position.x : first.position.y;
      const end = axis === 'horizontal' ? last.position.x : last.position.y;
      const gap = (end - start) / Math.max(1, sorted.length - 1);

      return sorted.map((node, index) => {
        const nextValue = start + gap * index;
        return {
          ...node,
          position: snapPosition(
            axis === 'horizontal'
              ? { x: nextValue, y: node.position.y }
              : { x: node.position.x, y: nextValue }
          )
        };
      });
    });
  }, [updateSelectedNodes]);

  const tidySelection = useCallback(() => {
    updateSelectedNodes((nodes) => {
      const sorted = [...nodes].sort((left, right) => {
        if (left.position.y === right.position.y) {
          return left.position.x - right.position.x;
        }

        return left.position.y - right.position.y;
      });

      if (!sorted.length) {
        return sorted;
      }

      const origin = { x: sorted[0].position.x, y: sorted[0].position.y };
      const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(sorted.length))));

      return sorted.map((node, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        return {
          ...node,
          position: snapPosition({
            x: origin.x + column * 220,
            y: origin.y + row * 164
          })
        };
      });
    });
  }, [updateSelectedNodes]);

  const groupSelection = useCallback(() => {
    if (selectedNodeIds.length < 2) {
      return;
    }

    const groupId = createId('group');
    updateSelectedNodes((nodes) => nodes.map((node) => ({ ...node, groupId })));
  }, [selectedNodeIds.length, updateSelectedNodes]);

  const ungroupSelection = useCallback(() => {
    updateSelectedNodes((nodes) => nodes.map((node) => ({ ...node, groupId: undefined })));
  }, [updateSelectedNodes]);

  const moveSelectionInStack = useCallback((direction: 'front' | 'back') => {
    if (!selectedNodeIds.length) {
      return;
    }

    const selectedIdSet = new Set(selectedNodeIds);

    transformFlowChart((prev) => {
      const maxZ = prev.nodes.reduce((max, node) => Math.max(max, node.zIndex ?? 0), 0);
      const minZ = prev.nodes.reduce((min, node) => Math.min(min, node.zIndex ?? 0), 0);
      let indexOffset = 0;

      return {
        ...prev,
        nodes: prev.nodes.map((node) => {
          if (!selectedIdSet.has(node.id) || node.locked) {
            return node;
          }

          indexOffset += 1;

          return {
            ...node,
            zIndex: direction === 'front' ? maxZ + indexOffset : minZ - indexOffset
          };
        }),
        updatedAt: new Date()
      };
    });
  }, [selectedNodeIds, transformFlowChart]);

  const fitSelection = useCallback(() => {
    const nodesToFit = flowChart.nodes.filter((node) => selectedNodeIds.includes(node.id));
    scheduleScrollToNodes(nodesToFit.length ? nodesToFit : flowChart.nodes);
  }, [flowChart.nodes, scheduleScrollToNodes, selectedNodeIds]);

  const nudgeSelectedNodes = useCallback((deltaX: number, deltaY: number) => {
    if (!selectedNodeIds.length) {
      return;
    }

    const selectedIdSet = new Set(selectedNodeIds);

    transformFlowChart((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) =>
        selectedIdSet.has(node.id) && !node.locked
          ? {
              ...node,
              position: snapPosition({
                x: node.position.x + deltaX,
                y: node.position.y + deltaY
              })
            }
          : node
      ),
      updatedAt: new Date()
    }));
  }, [selectedNodeIds, transformFlowChart]);

  const quickCreateConnectedNode = useCallback((direction: 'up' | 'right' | 'down' | 'left') => {
    const anchorNode = selectedNodeData;

    if (!anchorNode || anchorNode.locked) {
      return;
    }

    const deltaByDirection = {
      up: { x: 0, y: -180, fromSide: 'top' as const, toSide: 'bottom' as const },
      right: { x: 220, y: 0, fromSide: 'right' as const, toSide: 'left' as const },
      down: { x: 0, y: 180, fromSide: 'bottom' as const, toSide: 'top' as const },
      left: { x: -220, y: 0, fromSide: 'left' as const, toSide: 'right' as const }
    };
    const placement = deltaByDirection[direction];
    let nextX = anchorNode.position.x + placement.x;
    let nextY = anchorNode.position.y + placement.y;

    const isOccupied = (x: number, y: number) => {
      return flowChart.nodes.some(
        (n) => Math.abs(n.position.x - x) < 50 && Math.abs(n.position.y - y) < 50
      );
    };

    while (isOccupied(nextX, nextY)) {
      nextX += placement.x ? Math.sign(placement.x) * 150 : 0;
      nextY += placement.y ? Math.sign(placement.y) * 120 : 0;
    }

    const newNodeId = createId('node');
    const nextNode = createNodeDraft('process', {
      x: nextX,
      y: nextY
    }, { id: newNodeId });
    const nextConnection: Connection = {
      id: createId('connection'),
      from: anchorNode.id,
      to: newNodeId,
      fromSide: placement.fromSide,
      toSide: placement.toSide,
      type: 'curved',
      startMarker: 'none',
      endMarker: 'arrow',
      labelPosition: 0.5
    };

    transformFlowChart((prev) => ({
      ...prev,
      nodes: [...prev.nodes, { ...nextNode, zIndex: getNextNodeZIndex(prev.nodes) }],
      connections: [...prev.connections, nextConnection],
      updatedAt: new Date()
    }));
    setNodeSelection([newNodeId], newNodeId);
    setLastUsedNodeType('process');
    setShowCanvasHints(false);
  }, [createNodeDraft, selectedNodeData, setNodeSelection, transformFlowChart, flowChart.nodes]);

  const setSelectionLocked = useCallback((locked: boolean) => {
    if (!selectedNodeIds.length) {
      return;
    }

    const selectedIdSet = new Set(selectedNodeIds);

    transformFlowChart((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) =>
        selectedIdSet.has(node.id)
          ? {
              ...node,
              locked
            }
          : node
      ),
      updatedAt: new Date()
    }));
  }, [selectedNodeIds, transformFlowChart]);

  const deleteSelectedNodes = useCallback(() => {
    const removableNodeIds = selectedNodesData.filter((node) => !node.locked).map((node) => node.id);

    if (!removableNodeIds.length) {
      return;
    }

    const removableNodeIdSet = new Set(removableNodeIds);
    transformFlowChart((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((node) => !removableNodeIdSet.has(node.id)),
      connections: prev.connections.filter(
        (connection) => !removableNodeIdSet.has(connection.from) && !removableNodeIdSet.has(connection.to)
      ),
      updatedAt: new Date()
    }));
    setSelectedNodeIds((previous) => previous.filter((nodeId) => !removableNodeIdSet.has(nodeId)));
    setSelectedNode(null);
  }, [selectedNodesData, setSelectedNode, transformFlowChart]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (isTypingTarget && event.key !== 'Escape') {
        return;
      }
      if (event.code === 'Space' && !isTypingTarget) {
        event.preventDefault();
        setIsSpacePressed(true);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleManualSave();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        selectAllNodes();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        void copySelectionToClipboard();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        void pasteSelection();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateSelection();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && (event.key === '=' || event.key === '+')) {
        event.preventDefault();
        handleZoomIn();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === '-') {
        event.preventDefault();
        handleZoomOut();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === '0') {
        event.preventDefault();
        handleResetZoom();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsCommandMenuOpen(true);
        return;
      }



      if (event.key === '/') {
        event.preventDefault();
        setIsCommandMenuOpen(true);
        return;
      }

      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        const normalizedKey = event.key.toLowerCase();

        if (normalizedKey === 'r') {
          event.preventDefault();
          addNodeFromPalette('process');
          return;
        }

        if (normalizedKey === 'd') {
          event.preventDefault();
          addNodeFromPalette('decision');
          return;
        }

        if (normalizedKey === 'o') {
          event.preventDefault();
          addNodeFromPalette('connector');
          return;
        }

        if (normalizedKey === 'l') {
          event.preventDefault();
          addNodeFromPalette('annotation');
          return;
        }

        if (normalizedKey === 't') {
          event.preventDefault();
          addNodeFromPalette('triangle');
          return;
        }

        if (normalizedKey === 'f') {
          event.preventDefault();
          fitSelection();
          return;
        }
      }

      if (!event.ctrlKey && !event.metaKey && selectedNodeIds.length > 1) {
        if (event.key === 'g') {
          event.preventDefault();
          groupSelection();
          return;
        }

        if (event.key === 'G') {
          event.preventDefault();
          ungroupSelection();
          return;
        }
      }

      if (event.altKey && selectedNodeData) {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          quickCreateConnectedNode('up');
          return;
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault();
          quickCreateConnectedNode('right');
          return;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          quickCreateConnectedNode('down');
          return;
        }

        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          quickCreateConnectedNode('left');
          return;
        }
      }

      if (event.key === 'Escape') {
        closeCommandMenu();
        setConnectorQuickAdd(null);
        setDragConnector(null);
        clearSelection();
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedConnectionData) {
          deleteConnection(selectedConnectionData.id);
          setSelectedConnection(null);
          return;
        }

        if (selectedNodeIds.length) {
          deleteSelectedNodes();
        }

        return;
      }

      if (selectedNodeIds.length) {
        const step = event.shiftKey ? GRID_SIZE : 8;

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          nudgeSelectedNodes(0, -step);
          return;
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault();
          nudgeSelectedNodes(step, 0);
          return;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          nudgeSelectedNodes(0, step);
          return;
        }

        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          nudgeSelectedNodes(-step, 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    addNodeFromPalette,
    clearSelection,
    copySelectionToClipboard,
    deleteConnection,
    deleteSelectedNodes,
    duplicateSelection,
    fitSelection,
    groupSelection,
    handleManualSave,
    handleResetZoom,
    handleZoomIn,
    handleZoomOut,
    nudgeSelectedNodes,
    pasteSelection,
    quickCreateConnectedNode,
    selectAllNodes,
    closeCommandMenu,
    selectedConnectionData,
    selectedNodeData,
    selectedNodeIds,
    setSelectedNode,
    ungroupSelection,
    transformFlowChart
  ]);

  useEffect(() => {
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    const handleWindowBlur = () => {
      setIsSpacePressed(false);
      setIsPanning(false);
    };

    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key === 'Escape' && presentationMode) {
        setPresentationMode(false);
        return;
      }

      const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
      if (isArrowKey) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        
        if (selectedNodeIds.length > 0) {
          const deltaX = event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0;
          const deltaY = event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0;
          
          transformFlowChart((prev) => ({
            ...prev,
            nodes: prev.nodes.map((node) => 
              selectedNodeIds.includes(node.id)
                ? { ...node, position: { x: node.position.x + deltaX, y: node.position.y + deltaY } }
                : node
            ),
            updatedAt: new Date()
          }));
        } else {
          const deltaX = event.key === 'ArrowRight' ? 20 : event.key === 'ArrowLeft' ? -20 : 0;
          const deltaY = event.key === 'ArrowDown' ? 20 : event.key === 'ArrowUp' ? -20 : 0;
          if (workspaceViewportRef.current) {
            workspaceViewportRef.current.scrollBy({ left: deltaX, top: deltaY, behavior: 'auto' });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, transformFlowChart, presentationMode]);

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center px-6 ${loadingShellClass}`}>
        <div className={`flex items-center gap-4 rounded-[28px] border px-6 py-5 backdrop-blur-xl ${loadingCardClass}`}>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              isDarkWorkspace ? 'bg-sky-500/10 text-sky-300' : 'bg-orange-100 text-orange-600'
            }`}
          >
            <Loader className="h-5 w-5 animate-spin" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Preparing workspace</p>
            <p className={`mt-1 text-base font-medium ${isDarkWorkspace ? 'text-slate-100' : 'text-slate-900'}`}>
              Loading your board and recent changes...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen overflow-hidden ${shellClass}`}>
      <div className="flex h-full min-h-0 flex-col xl:flex-row">
        {!isLeftRailCollapsed && !presentationMode && (
          <EditorToolRail
            nodeTypes={toolRailNodeTypes}
            addNodeFromPalette={addNodeFromPalette}
            onFocusAI={focusAIComposer}
            onImport={() => fileInputRef.current?.click()}
            onExportJson={() => handleExport('json')}
            workspaceTheme={workspaceTheme}
            onClose={() => setIsLeftRailCollapsed(true)}
          />
        )}

        <main className={`min-h-0 min-w-0 flex-1 ${mainClass}`}>
          <div className="flex h-full min-w-0 flex-col">
            {!presentationMode && !isTopBarCollapsed && <EditorTopBar
              onClose={() => setIsTopBarCollapsed(true)}
              flowchartName={flowchartName}
              onNameChange={setFlowchartName}
              onBack={() => navigate('/')}
              onUndo={undo}
              onRedo={redo}
              onSave={handleManualSave}
              canUndo={canUndo}
              canRedo={canRedo}
              isSaving={isSaving || !id}
              justSaved={justSaved}
              nodeCount={flowChart.nodes.length}
              connectionCount={flowChart.connections.length}
              isLinking={dragConnector !== null}
              workspaceTheme={workspaceTheme}
              onThemeChange={setWorkspaceTheme}
              onExportPng={(transparent) => void handleExport('png', { transparent })}
              onExportSvg={(transparent) => void handleExport('svg', { transparent })}
              onExportPdf={() => void handleExport('pdf')}
              onExportJson={() => void handleExport('json')}
              onPresent={() => setPresentationMode(true)}
            />}

            <div className={`relative min-h-[560px] flex-1 overflow-hidden ${canvasShellClass}`}>
              <EditorCanvasChrome
                hasNodes={flowChart.nodes.length > 0}
                connectingNodeLabel={connectingNodeLabel}
                zoomLabel={zoomLabel}
                showHints={showCanvasHints}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                onFitCanvas={() => scheduleScrollToNodes(flowChart.nodes)}
                onFitSelection={fitSelection}
                workspaceTheme={workspaceTheme}
              />

              {isTopBarCollapsed && !presentationMode && (
                <button
                  onClick={() => setIsTopBarCollapsed(false)}
                  className={`absolute left-1/2 top-4 z-40 -translate-x-1/2 rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-lg backdrop-blur ${
                    isDarkWorkspace
                      ? 'border-white/10 bg-[#17191d]/92 text-slate-200 hover:border-white/20 hover:bg-[#1b1d22]'
                      : 'border-white/80 bg-white/92 text-slate-700 hover:border-slate-300 hover:bg-white'
                  }`}
                  title="Show header"
                >
                  Show header
                </button>
              )}

              {isLeftRailCollapsed && (
                <button
                  onClick={() => setIsLeftRailCollapsed(false)}
                  className={`absolute left-4 top-1/2 z-40 hidden -translate-y-1/2 rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-lg backdrop-blur xl:inline-flex ${
                    isDarkWorkspace
                      ? 'border-white/10 bg-[#17191d]/92 text-slate-200 hover:border-white/20 hover:bg-[#1b1d22]'
                      : 'border-white/80 bg-white/92 text-slate-700 hover:border-slate-300 hover:bg-white'
                  }`}
                  title="Show tools"
                >
                  Show tools
                </button>
              )}

              {isRightSidebarCollapsed && (
                <button
                  onClick={() => setIsRightSidebarCollapsed(false)}
                  className={`absolute right-4 top-1/2 z-40 hidden -translate-y-1/2 rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-lg backdrop-blur xl:inline-flex ${
                    isDarkWorkspace
                      ? 'border-white/10 bg-[#17191d]/92 text-slate-200 hover:border-white/20 hover:bg-[#1b1d22]'
                      : 'border-white/80 bg-white/92 text-slate-700 hover:border-slate-300 hover:bg-white'
                  }`}
                  title="Show inspector"
                >
                  Show inspector
                </button>
              )}

              <SelectionContextBar
                isVisible={Boolean(selectedNodeIds.length > 1 && multiToolbarPosition)}
                x={multiToolbarPosition?.x ?? 0}
                y={multiToolbarPosition?.y ?? 0}
                mode="multi"
                workspaceTheme={workspaceTheme}
                canUngroup={canUngroupSelection}
                hasLockedNodes={hasLockedSelection}
                allLocked={allSelectedNodesLocked}
                onAlignLeft={() => alignSelection('left')}
                onAlignTop={() => alignSelection('top')}
                onDistributeHorizontal={() => distributeSelection('horizontal')}
                onDistributeVertical={() => distributeSelection('vertical')}
                onTidy={tidySelection}
                onGroup={groupSelection}
                onUngroup={ungroupSelection}
                onBringForward={() => moveSelectionInStack('front')}
                onSendBackward={() => moveSelectionInStack('back')}
                onLock={() => setSelectionLocked(true)}
                onUnlock={() => setSelectionLocked(false)}
              />

              <SelectionContextBar
                isVisible={Boolean(selectedNodeData && nodeToolbarPosition)}
                x={nodeToolbarPosition?.x ?? 0}
                y={nodeToolbarPosition?.y ?? 0}
                workspaceTheme={workspaceTheme}
                mode="node"
                nodeType={selectedNodeData?.type ?? 'process'}
                isLocked={Boolean(selectedNodeData?.locked)}
                nodeTypes={nodeTypes}
                onNodeTypeChange={(type) => {
                  if (selectedNodeData && !selectedNodeData.locked) {
                    updateNode(selectedNodeData.id, { type });
                  }
                }}
                onQuickCreateRight={() => quickCreateConnectedNode('right')}
                onQuickCreateDown={() => quickCreateConnectedNode('down')}
                onOpenQuickAdd={() => {
                  if (selectedNodeData) {
                    openQuickAddFromNode(selectedNodeData);
                  }
                }}
                onDuplicate={handleDuplicateSelectedNode}
                onToggleLock={() => {
                  if (selectedNodeData) {
                    setSelectionLocked(!selectedNodeData.locked);
                  }
                }}
                onDelete={() => {
                  if (selectedNodeData && !selectedNodeData.locked) {
                    transformFlowChart((prev) => ({
                      ...prev,
                      nodes: prev.nodes.filter((node) => node.id !== selectedNodeData.id),
                      connections: prev.connections.filter(
                        (connection) => connection.from !== selectedNodeData.id && connection.to !== selectedNodeData.id
                      ),
                      updatedAt: new Date()
                    }));
                    setSelectedNodeIds([]);
                    setSelectedNode(null);
                  }
                }}
              />

              <SelectionContextBar
                isVisible={Boolean(selectedConnectionData && connectionToolbarPosition)}
                x={connectionToolbarPosition?.x ?? 0}
                y={connectionToolbarPosition?.y ?? 0}
                mode="connection"
                workspaceTheme={workspaceTheme}
                connectionType={selectedConnectionData?.type ?? 'curved'}
                startMarker={selectedConnectionData?.startMarker ?? 'none'}
                endMarker={selectedConnectionData?.endMarker ?? 'arrow'}
                hasManualRoute={Boolean(selectedConnectionData?.waypoints?.length)}
                onConnectionTypeChange={(type) => {
                  if (selectedConnectionData) {
                    updateConnection(selectedConnectionData.id, { type });
                  }
                }}
                onToggleMarker={(side) => {
                  if (selectedConnectionData) {
                    const currentValue = selectedConnectionData[side] ?? (side === 'endMarker' ? 'arrow' : 'none');
                    updateConnection(selectedConnectionData.id, {
                      [side]: currentValue === 'arrow' ? 'none' : 'arrow'
                    });
                  }
                }}
                onAddLabel={() => {
                  if (selectedConnectionData) {
                    updateConnection(selectedConnectionData.id, {
                      label: selectedConnectionData.label ?? 'Label'
                    });
                  }
                }}
                onResetRoute={() => {
                  if (selectedConnectionData) {
                    updateConnection(selectedConnectionData.id, { waypoints: undefined });
                  }
                }}
                onOpenQuickAdd={openQuickAddFromConnection}
                onDelete={() => {
                  if (selectedConnectionData) {
                    deleteConnection(selectedConnectionData.id);
                    setSelectedConnection(null);
                  }
                }}
              />

              <ConnectorQuickAdd
                isOpen={Boolean(connectorQuickAdd && quickAddOverlayPosition)}
                x={quickAddOverlayPosition?.x ?? 0}
                y={quickAddOverlayPosition?.y ?? 0}
                workspaceTheme={workspaceTheme}
                title={connectorQuickAdd?.title ?? 'Create the next block'}
                items={connectorQuickAddItems}
                onSelect={handleCreateNodeFromConnector}
                onClose={() => setConnectorQuickAdd(null)}
              />

              <CommandMenu
                isOpen={isCommandMenuOpen}
                query={commandMenuQuery}
                workspaceTheme={workspaceTheme}
                items={commandMenuItems}
                onQueryChange={setCommandMenuQuery}
                onSelect={handleCommandSelect}
                onClose={closeCommandMenu}
              />

              <div
                ref={workspaceViewportRef}
                className={`h-full w-full overflow-auto ${
                  isPanning ? 'cursor-grabbing' : isSpacePressed ? 'cursor-grab' : 'cursor-default'
                }`}
                onMouseDown={handleWorkspacePanStart}
                onWheel={handleWorkspaceWheel}
                onScroll={syncViewportState}
              >
                <div
                  className="relative"
                  style={{
                    width: `${workspaceMetrics.width * zoom}px`,
                    height: `${workspaceMetrics.height * zoom}px`
                  }}
                >
                  <div
                    ref={canvasRef}
                    id="flowchart-canvas"
                    className="absolute left-0 top-0 origin-top-left"
                    style={{
                      width: `${workspaceMetrics.width}px`,
                      height: `${workspaceMetrics.height}px`,
                      transform: `scale(${zoom})`
                    }}
                    onMouseDown={handleCanvasMouseDown}
                    onClick={handleCanvasClick}
                    onDoubleClick={handleCanvasDoubleClick}
                  >
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{ backgroundImage: workspaceBackground }}
                    />

                    <div className="absolute inset-0 pointer-events-none opacity-70">
                      <svg
                        width={workspaceMetrics.width}
                        height={workspaceMetrics.height}
                        className="absolute inset-0"
                      >
                        <defs>
                          <pattern id={gridPatternId} width="24" height="24" patternUnits="userSpaceOnUse">
                            <path
                              d="M 24 0 L 0 0 0 24"
                              fill="none"
                              stroke={workspaceGridStroke}
                              strokeWidth="1"
                            />
                          </pattern>
                        </defs>
                        <rect width={workspaceMetrics.width} height={workspaceMetrics.height} fill={`url(#${gridPatternId})`} />
                      </svg>
                    </div>

                    {alignmentGuides.map((guide, i) => (
                      <div
                        key={i}
                        className="absolute z-20 pointer-events-none"
                        style={{
                          backgroundColor: '#ef4444',
                          ...(guide.type === 'vertical'
                            ? { left: guide.position, top: guide.start, width: 1, height: guide.end - guide.start }
                            : { top: guide.position, left: guide.start, height: 1, width: guide.end - guide.start })
                        }}
                      />
                    ))}

                    {selectionBox && (
                      <div
                        className="pointer-events-none absolute z-20 rounded-[20px] border-2 border-sky-400/80 bg-sky-400/10"
                        style={normalizeSelectionBox(selectionBox)}
                      />
                    )}

                    <svg
                      className="pointer-events-none absolute inset-0"
                      style={{
                        zIndex: 5,
                        width: `${workspaceMetrics.width}px`,
                        height: `${workspaceMetrics.height}px`
                      }}
                    >
                      {flowChart.connections.map((connection) => {
                        const fromNode = flowChart.nodes.find((node) => node.id === connection.from);
                        const toNode = flowChart.nodes.find((node) => node.id === connection.to);

                        if (!fromNode || !toNode) {
                          return null;
                        }

                        return (
                          <ConnectionLine
                            key={connection.id}
                            connection={connection}
                            fromNode={fromNode}
                            toNode={toNode}
                            obstacleNodes={flowChart.nodes.filter(
                              (node) => node.id !== connection.from && node.id !== connection.to
                            )}
                            isSelected={selectedConnection === connection.id}
                            onSelect={() => {
                              setSelectedConnection(connection.id);
                              setSelectedNodeIds([]);
                              setSelectedNode(null);
                            }}
                            onDelete={() => {
                              deleteConnection(connection.id);
                              setSelectedConnection(null);
                            }}
                            onLabelPositionChange={(labelPosition) => {
                              updateConnection(connection.id, { labelPosition });
                            }}
                            onLabelChange={(label) => {
                              updateConnection(connection.id, { label });
                            }}
                            onWaypointsChange={(waypoints) => {
                              updateConnection(connection.id, { waypoints });
                            }}
                            workspaceTheme={workspaceTheme}
                          />
                        );
                      })}

                      {dragConnectorPreview && (
                        <>
                          <path
                            d={dragConnectorPreview.path}
                            stroke={isDarkWorkspace ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.92)'}
                            strokeWidth="6"
                            fill="none"
                            strokeLinecap="round"
                            className="pointer-events-none"
                          />
                          <path
                            d={dragConnectorPreview.path}
                            stroke="#c084fc"
                            strokeWidth="2.6"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray="8 6"
                            className="pointer-events-none"
                          />
                          <circle
                            cx={dragConnectorPreview.targetPoint.x}
                            cy={dragConnectorPreview.targetPoint.y}
                            r="5"
                            fill="#ffffff"
                            stroke="#c084fc"
                            strokeWidth="2"
                            className="pointer-events-none"
                          />
                        </>
                      )}
                    </svg>

                    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 10 }}>
                      {[...flowChart.nodes]
                        .sort((left, right) => (left.zIndex ?? 0) - (right.zIndex ?? 0))
                        .map((node) => (
                        <Node
                          key={node.id}
                          node={node}
                          isSelected={selectedNodeIds.includes(node.id)}
                          isConnectorTarget={dragConnector?.targetNodeId === node.id}
                          showControls={selectedNodeIds.length === 1 && selectedNodeIds[0] === node.id}
                          showConnectionHandles={
                            dragConnector !== null || (selectedNodeIds.length === 1 && selectedNodeIds[0] === node.id)
                          }
                          isDragging={draggedNode === node.id}
                          zoom={zoom}
                          workspaceTheme={workspaceTheme}
                          onSelect={(options) => handleNodeSelect(node.id, options)}
                          onDragStart={() => handleNodeDragStart(node.id)}
                          onDrag={(delta) => handleNodeDrag(delta)}
                          onDragEnd={handleNodeDragEnd}
                          onResizeStart={() => handleNodeResizeStart(node.id)}
                          onResize={(nextBounds) => handleNodeResize(node.id, nextBounds)}
                          onResizeEnd={handleNodeResizeEnd}
                          onTextChange={(text) => {
                            if (!node.locked) {
                              updateNode(node.id, { text });
                            }
                          }}
                          onDelete={() => {
                            if (node.locked) {
                              return;
                            }

                            transformFlowChart((prev) => ({
                              ...prev,
                              nodes: prev.nodes.filter((item) => item.id !== node.id),
                              connections: prev.connections.filter(
                                (connection) => connection.from !== node.id && connection.to !== node.id
                              ),
                              updatedAt: new Date()
                            }));
                            setSelectedNodeIds((previous) => previous.filter((id) => id !== node.id));
                            setSelectedNode(null);
                          }}
                          onConnectStart={handleConnectStart}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {!presentationMode && <EditorMinimap
                nodes={flowChart.nodes}
                workspaceWidth={workspaceMetrics.width}
                workspaceHeight={workspaceMetrics.height}
                viewportScrollLeft={viewportState.scrollLeft}
                viewportScrollTop={viewportState.scrollTop}
                viewportWidth={viewportState.width}
                viewportHeight={viewportState.height}
                zoom={zoom}
                workspaceTheme={workspaceTheme}
                onNavigate={handleMinimapNavigate}
              />}
            </div>

            {presentationMode && (
              <button
                onClick={() => setPresentationMode(false)}
                className="absolute top-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-slate-900/80 px-5 py-2.5 text-sm font-medium text-white shadow-xl backdrop-blur transition hover:bg-slate-800"
              >
                <span className="flex h-5 items-center justify-center rounded border border-white/30 bg-white/10 px-1.5 text-[10px] font-bold tracking-widest text-white/70">ESC</span>
                Exit Presentation
              </button>
            )}
          </div>
        </main>

        {!isRightSidebarCollapsed && !presentationMode && (
          <EditorSidebar
            errorMessage={errorMessage}
            aiDescription={aiDescription}
            onAiDescriptionChange={setAiDescription}
            starterPrompts={starterPrompts}
            onStarterPromptClick={(prompt) => {
              setAiDescription(prompt);
              aiTextareaRef.current?.focus();
            }}
            onGenerate={handleAIGenerate}
            isGenerating={isGenerating}
            aiTextareaRef={aiTextareaRef}
            nodeTypes={nodeTypes}
            addNodeFromPalette={addNodeFromPalette}
            selectedNodeData={selectedNodeData}
            selectedNodeCount={selectedNodeIds.length}
            hasLockedSelection={hasLockedSelection}
            allSelectedNodesLocked={allSelectedNodesLocked}
            selectedConnectionData={selectedConnectionData}
            selectedConnectionEndpoints={selectedConnectionEndpoints}
            updateNodeText={(text) => {
              if (selectedNodeData && !selectedNodeData.locked) {
                updateNode(selectedNodeData.id, { text });
              }
            }}
            updateNodeType={(type) => {
              if (selectedNodeData && !selectedNodeData.locked) {
                updateNode(selectedNodeData.id, { type });
              }
            }}
            updateNodeStyle={(style) => {
              if (selectedNodeData && !selectedNodeData.locked) {
                updateNode(selectedNodeData.id, { style });
              }
            }}
            onSetSelectionLocked={setSelectionLocked}
            onDeleteSelectedNode={() => {
              if (selectedNodeData && !selectedNodeData.locked) {
                transformFlowChart((prev) => ({
                  ...prev,
                  nodes: prev.nodes.filter((node) => node.id !== selectedNodeData.id),
                  connections: prev.connections.filter(
                    (connection) => connection.from !== selectedNodeData.id && connection.to !== selectedNodeData.id
                  ),
                  updatedAt: new Date()
                }));
                setSelectedNodeIds([]);
                setSelectedNode(null);
              }
            }}
            onDeleteSelectedNodes={deleteSelectedNodes}
            onDeleteSelectedConnection={() => {
              if (selectedConnectionData) {
                deleteConnection(selectedConnectionData.id);
                setSelectedConnection(null);
              }
            }}
            updateConnectionLabel={(label) => {
              if (selectedConnectionData) {
                updateConnection(selectedConnectionData.id, { label: label.trim() ? label : undefined });
              }
            }}
            updateConnectionType={(type) => {
              if (selectedConnectionData) {
                updateConnection(selectedConnectionData.id, { type });
              }
            }}
            updateConnectionAnimated={(animated) => {
              if (selectedConnectionData) {
                updateConnection(selectedConnectionData.id, { animated });
              }
            }}
            updateConnectionMarker={(side, marker) => {
              if (selectedConnectionData) {
                updateConnection(selectedConnectionData.id, { [side]: marker });
              }
            }}
            updateConnectionColor={(color) => {
              if (selectedConnectionData) {
                updateConnection(selectedConnectionData.id, { color });
              }
            }}
            onResetConnectionRoute={() => {
              if (selectedConnectionData) {
                updateConnection(selectedConnectionData.id, { waypoints: undefined });
              }
            }}
            onImport={() => fileInputRef.current?.click()}
            onExportJson={() => handleExport('json')}
            onExportPng={() => void handleExport('png')}
            onExportSvg={() => void handleExport('svg')}
            onExportPdf={() => void handleExport('pdf')}
            onClearBoard={handleClearAll}
            onClose={() => setIsRightSidebarCollapsed(true)}
            onSaveNodeStyleAsDefault={saveSelectedNodeStyleAsDefault}
            workspaceTheme={workspaceTheme}
          />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={(e) => {
          const file = e.target.files?.[0];

          if (file) {
            handleImport(file);
            e.target.value = '';
          }
        }}
        className="hidden"
      />
    </div>
  );
}

function materializeAIFlowChart(result: AIFlowChartResponse): {
  nodes: FlowChartNode[];
  connections: Connection[];
} {
  const rawNodes = result.nodes.map((node) => ({
    ...node,
    id: createId('node'),
    position: { ...node.position },
    style: node.style ? { ...node.style } : undefined
  }));
  const nodes = ensureWorkspacePadding(rawNodes).map((node, index) => ({
    ...node,
    zIndex: index + 1
  }));

  const connections = result.connections.flatMap((connection) => {
    const fromNode = nodes[connection.fromIndex];
    const toNode = nodes[connection.toIndex];

    if (!fromNode || !toNode) {
      return [];
    }

    return [
      {
        id: createId('connection'),
        from: fromNode.id,
        to: toNode.id,
        fromSide: connection.fromSide,
        toSide: connection.toSide,
        type: 'curved' as const,
        startMarker: 'none' as const,
        endMarker: 'arrow' as const,
        labelPosition: 0.5,
        ...(connection.label ? { label: connection.label } : {})
      }
    ];
  });

  return { nodes, connections };
}

function parseImportedFlowChart(
  fileContents: string | ArrayBuffer | null | undefined,
  fallbackName: string
): {
  name: string;
  nodes: FlowChartNode[];
  connections: Connection[];
} {
  if (typeof fileContents !== 'string') {
    throw new Error('The selected file could not be read.');
  }

  const parsed = JSON.parse(fileContents) as unknown;

  if (!isRecord(parsed) || !Array.isArray(parsed.nodes)) {
    throw new Error('This file does not contain a valid flowchart.');
  }

  const usedNodeIds = new Set<string>();
  const nodes = parsed.nodes.map((node, index) => normalizeImportedNode(node, index, usedNodeIds));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const rawConnections = Array.isArray(parsed.connections) ? parsed.connections : [];
  const usedConnectionIds = new Set<string>();
  const connections = rawConnections.map((connection, index) =>
    normalizeImportedConnection(connection, index, nodeIds, usedConnectionIds)
  );
  const name =
    typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : fallbackName;

  return { name, nodes, connections };
}

function ensureWorkspacePadding(nodes: FlowChartNode[]): FlowChartNode[] {
  const { shiftX, shiftY } = getWorkspacePaddingShift(nodes);

  if (shiftX === 0 && shiftY === 0) {
    return nodes.map((node) => ({
      ...node,
      position: { ...node.position },
      style: node.style ? { ...node.style } : undefined
    }));
  }

  return nodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x + shiftX,
      y: node.position.y + shiftY
    },
    style: node.style ? { ...node.style } : undefined
  }));
}

function applyWorkspacePadding(nodes: FlowChartNode[], connections: Connection[]) {
  const { shiftX, shiftY } = getWorkspacePaddingShift(nodes);

  return {
    nodes: ensureWorkspacePadding(nodes),
    connections:
      shiftX === 0 && shiftY === 0
        ? connections.map((connection) => ({
            ...connection,
            waypoints: connection.waypoints?.map((point) => ({ ...point }))
          }))
        : connections.map((connection) => ({
            ...connection,
            waypoints: connection.waypoints?.map((point) => ({
              x: point.x + shiftX,
              y: point.y + shiftY
            }))
          }))
  };
}

function getWorkspacePaddingShift(nodes: FlowChartNode[]) {
  if (!nodes.length) {
    return { shiftX: 0, shiftY: 0 };
  }

  const bounds = getNodeBounds(nodes);
  return {
    shiftX: Math.max(0, WORKSPACE_SAFE_LEFT - bounds.minX),
    shiftY: Math.max(0, WORKSPACE_SAFE_TOP - bounds.minY)
  };
}

function getWorkspaceMetrics(nodes: FlowChartNode[]): { width: number; height: number } {
  const bounds = getNodeBounds(nodes);

  return {
    width: Math.max(MIN_WORKSPACE_WIDTH, bounds.maxX + WORKSPACE_PADDING),
    height: Math.max(MIN_WORKSPACE_HEIGHT, bounds.maxY + WORKSPACE_PADDING)
  };
}

function getNodeBounds(nodes: FlowChartNode[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (!nodes.length) {
    return {
      minX: WORKSPACE_SAFE_LEFT,
      minY: WORKSPACE_SAFE_TOP,
      maxX: WORKSPACE_SAFE_LEFT + 400,
      maxY: WORKSPACE_SAFE_TOP + 260
    };
  }

  return nodes.reduce(
    (bounds, node) => ({
      minX: Math.min(bounds.minX, node.position.x),
      minY: Math.min(bounds.minY, node.position.y),
      maxX: Math.max(bounds.maxX, node.position.x + node.width),
      maxY: Math.max(bounds.maxY, node.position.y + node.height)
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: 0,
      maxY: 0
    }
  );
}

function getNodeAtPoint(
  nodes: FlowChartNode[],
  point: Position,
  excludedNodeId?: string
): FlowChartNode | null {
  const reversed = [...nodes].sort((left, right) => (right.zIndex ?? 0) - (left.zIndex ?? 0));

  return (
    reversed.find((node) => {
      if (node.id === excludedNodeId) {
        return false;
      }

      return (
        point.x >= node.position.x &&
        point.x <= node.position.x + node.width &&
        point.y >= node.position.y &&
        point.y <= node.position.y + node.height
      );
    }) ?? null
  );
}

function getClosestNodeSide(node: FlowChartNode, point: Position): NodeSide {
  const distances: Record<NodeSide, number> = {
    top: Math.abs(point.y - node.position.y),
    right: Math.abs(node.position.x + node.width - point.x),
    bottom: Math.abs(node.position.y + node.height - point.y),
    left: Math.abs(point.x - node.position.x)
  };

  return (Object.entries(distances).sort((left, right) => left[1] - right[1])[0]?.[0] ?? 'right') as NodeSide;
}

function getNodeConnectionPoint(node: FlowChartNode, side: NodeSide): Position {
  switch (side) {
    case 'top':
      return { x: node.position.x + node.width / 2, y: node.position.y };
    case 'right':
      return { x: node.position.x + node.width, y: node.position.y + node.height / 2 };
    case 'bottom':
      return { x: node.position.x + node.width / 2, y: node.position.y + node.height };
    case 'left':
      return { x: node.position.x, y: node.position.y + node.height / 2 };
    default:
      return { x: node.position.x + node.width / 2, y: node.position.y + node.height };
  }
}

function getOppositeSide(side: NodeSide): NodeSide {
  switch (side) {
    case 'top':
      return 'bottom';
    case 'right':
      return 'left';
    case 'bottom':
      return 'top';
    case 'left':
      return 'right';
    default:
      return 'left';
  }
}

function getPreferredExpansionSide(side: NodeSide): NodeSide {
  if (side === 'left' || side === 'right') {
    return side;
  }

  return side === 'top' ? 'top' : 'bottom';
}

function getQuickAddDropPoint(node: FlowChartNode, side: NodeSide): Position {
  const gap = side === 'left' || side === 'right' ? 200 : 164;
  const anchor = getNodeConnectionPoint(node, side);

  switch (side) {
    case 'top':
      return { x: anchor.x, y: anchor.y - gap };
    case 'right':
      return { x: anchor.x + gap, y: anchor.y };
    case 'bottom':
      return { x: anchor.x, y: anchor.y + gap };
    case 'left':
      return { x: anchor.x - gap, y: anchor.y };
    default:
      return { x: anchor.x + gap, y: anchor.y };
  }
}

function projectWorkspacePoint(
  point: Position,
  viewportState: { scrollLeft: number; scrollTop: number },
  zoom: number
): Position {
  return {
    x: point.x * zoom - viewportState.scrollLeft,
    y: point.y * zoom - viewportState.scrollTop
  };
}

function buildPreviewConnectionPath(
  fromPoint: Position,
  toPoint: Position,
  fromSide: NodeSide,
  toSide: NodeSide
): string {
  const fromVector = getSideVector(fromSide);
  const toVector = getSideVector(toSide);
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const bendOffset = Math.max(44, Math.min(120, distance / 3));
  const ctrl1 = {
    x: fromPoint.x + fromVector.x * bendOffset,
    y: fromPoint.y + fromVector.y * bendOffset
  };
  const ctrl2 = {
    x: toPoint.x + toVector.x * bendOffset,
    y: toPoint.y + toVector.y * bendOffset
  };

  return `M ${fromPoint.x} ${fromPoint.y}
          C ${ctrl1.x} ${ctrl1.y}
            ${ctrl2.x} ${ctrl2.y}
            ${toPoint.x} ${toPoint.y}`;
}

function getSideVector(side: NodeSide) {
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
      return { x: 1, y: 0 };
  }
}

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function snapPosition(position: Position): Position {
  return {
    x: Math.max(0, snapSize(position.x)),
    y: Math.max(0, snapSize(position.y))
  };
}

function snapSize(value: number): number {
  return Math.max(GRID_SIZE, Math.round(value / GRID_SIZE) * GRID_SIZE);
}

function normalizeSelectionBox(selectionBox: SelectionBoxState) {
  return {
    x: selectionBox.width >= 0 ? selectionBox.x : selectionBox.x + selectionBox.width,
    y: selectionBox.height >= 0 ? selectionBox.y : selectionBox.y + selectionBox.height,
    width: Math.abs(selectionBox.width),
    height: Math.abs(selectionBox.height)
  };
}

function rectanglesIntersect(
  selectionRect: { x: number; y: number; width: number; height: number },
  nodeRect: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    selectionRect.x + selectionRect.width < nodeRect.x ||
    selectionRect.x > nodeRect.x + nodeRect.width ||
    selectionRect.y + selectionRect.height < nodeRect.y ||
    selectionRect.y > nodeRect.y + nodeRect.height
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function normalizeImportedNode(
  node: unknown,
  index: number,
  usedNodeIds: Set<string>
): FlowChartNode {
  if (!isRecord(node)) {
    throw new Error(`Node ${index + 1} is invalid.`);
  }

  const type = isNodeType(node.type) ? node.type : 'process';
  let id = typeof node.id === 'string' && node.id.trim() ? node.id.trim() : createId('node');

  if (usedNodeIds.has(id)) {
    id = createId('node');
  }

  usedNodeIds.add(id);

  const position = isRecord(node.position)
    ? {
        x: toFiniteNumber(node.position.x, 100),
        y: toFiniteNumber(node.position.y, 100)
      }
    : { x: 100, y: 100 };

  const style = normalizeNodeStyle(node.style);

  return {
    id,
    type,
    position,
    text:
      typeof node.text === 'string' && node.text.trim()
        ? node.text.trim()
        : `Imported node ${index + 1}`,
    width: toFiniteNumber(node.width, getDefaultWidth(type)),
    height: toFiniteNumber(node.height, getDefaultHeight(type)),
    ...(typeof node.groupId === 'string' && node.groupId.trim() ? { groupId: node.groupId.trim() } : {}),
    ...(typeof node.zIndex === 'number' && Number.isFinite(node.zIndex) ? { zIndex: node.zIndex } : {}),
    ...(typeof node.locked === 'boolean' ? { locked: node.locked } : {}),
    ...(style ? { style } : {})
  };
}

function normalizeImportedConnection(
  connection: unknown,
  index: number,
  nodeIds: Set<string>,
  usedConnectionIds: Set<string>
): Connection {
  if (!isRecord(connection)) {
    throw new Error(`Connection ${index + 1} is invalid.`);
  }

  const from = typeof connection.from === 'string' ? connection.from : '';
  const to = typeof connection.to === 'string' ? connection.to : '';

  if (!nodeIds.has(from) || !nodeIds.has(to)) {
    throw new Error(`Connection ${index + 1} references a missing node.`);
  }

  let id =
    typeof connection.id === 'string' && connection.id.trim()
      ? connection.id.trim()
      : createId('connection');

  if (usedConnectionIds.has(id)) {
    id = createId('connection');
  }

  usedConnectionIds.add(id);

  return {
    id,
    from,
    to,
    fromSide: isNodeSide(connection.fromSide) ? connection.fromSide : 'bottom',
    toSide: isNodeSide(connection.toSide) ? connection.toSide : 'top',
    type: isConnectionType(connection.type) ? connection.type : 'curved',
    startMarker: isConnectionMarker(connection.startMarker) ? connection.startMarker : 'none',
    endMarker: isConnectionMarker(connection.endMarker) ? connection.endMarker : 'arrow',
    ...(typeof connection.color === 'string' && connection.color.trim()
      ? { color: connection.color.trim() }
      : {}),
    ...(typeof connection.label === 'string' && connection.label.trim()
      ? { label: connection.label.trim() }
      : {}),
    ...(typeof connection.labelPosition === 'number' && Number.isFinite(connection.labelPosition)
      ? { labelPosition: Math.max(0.1, Math.min(0.9, connection.labelPosition)) }
      : { labelPosition: 0.5 }),
    ...(Array.isArray(connection.waypoints)
      ? {
          waypoints: connection.waypoints
            .filter((point): point is Record<string, unknown> => isRecord(point))
            .map((point) => ({
              x: toFiniteNumber(point.x, 0),
              y: toFiniteNumber(point.y, 0)
            }))
        }
      : {})
  };
}

function normalizeNodeStyle(style: unknown): FlowChartNode['style'] | undefined {
  if (!isRecord(style)) {
    return undefined;
  }

  const normalizedStyle: FlowChartNode['style'] = {};

  if (typeof style.backgroundColor === 'string' && style.backgroundColor.trim()) {
    normalizedStyle.backgroundColor = style.backgroundColor;
  }

  if (typeof style.borderColor === 'string' && style.borderColor.trim()) {
    normalizedStyle.borderColor = style.borderColor;
  }

  if (typeof style.color === 'string' && style.color.trim()) {
    normalizedStyle.color = style.color;
  }

  if (typeof style.textColor === 'string' && style.textColor.trim()) {
    normalizedStyle.textColor = style.textColor;
  }

  if (style.borderStyle === 'solid' || style.borderStyle === 'dashed' || style.borderStyle === 'none') {
    normalizedStyle.borderStyle = style.borderStyle;
  }

  if (typeof style.opacity === 'number' && Number.isFinite(style.opacity)) {
    normalizedStyle.opacity = Math.max(0.1, Math.min(1, style.opacity));
  }

  if (typeof style.fontSize === 'number' && Number.isFinite(style.fontSize)) {
    normalizedStyle.fontSize = Math.max(10, Math.min(24, style.fontSize));
  }

  if (style.fontWeight === 'normal' || style.fontWeight === 'bold') {
    normalizedStyle.fontWeight = style.fontWeight;
  }

  if (style.textAlign === 'left' || style.textAlign === 'center' || style.textAlign === 'right') {
    normalizedStyle.textAlign = style.textAlign;
  }

  if (style.rotation === 0 || style.rotation === 90 || style.rotation === 180 || style.rotation === 270) {
    normalizedStyle.rotation = style.rotation;
  }

  return Object.keys(normalizedStyle).length ? normalizedStyle : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNodeType(value: unknown): value is FlowChartNode['type'] {
  return (
    value === 'start' ||
    value === 'process' ||
    value === 'decision' ||
    value === 'end' ||
    value === 'connector' ||
    value === 'input' ||
    value === 'manualInput' ||
    value === 'manualOperation' ||
    value === 'triangle' ||
    value === 'hexagon' ||
    value === 'database' ||
    value === 'annotation'
  );
}

function isNodeSide(value: unknown): value is NodeSide {
  return value === 'top' || value === 'right' || value === 'bottom' || value === 'left';
}

function isConnectionType(value: unknown): value is ConnectionType {
  return value === 'curved' || value === 'straight' || value === 'elbow';
}

function isConnectionMarker(value: unknown): value is NonNullable<Connection['startMarker']> {
  return value === 'none' || value === 'arrow';
}

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
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
    case 'input':
      return 'Input / Output';
    case 'manualInput':
      return 'Manual Input';
    case 'manualOperation':
      return 'Manual Operation';
    case 'triangle':
      return 'Marker';
    case 'hexagon':
      return 'Preparation';
    case 'database':
      return 'Database';
    case 'annotation':
      return 'Annotation';
    default:
      return 'Node';
  }
}

function getDefaultWidth(type: FlowChartNode['type']): number {
  switch (type) {
    case 'start':
    case 'end':
      return 132;
    case 'decision':
      return 120;
    case 'connector':
      return 80;
    case 'input':
      return 160;
    case 'manualInput':
      return 150;
    case 'manualOperation':
      return 160;
    case 'triangle':
      return 110;
    case 'hexagon':
      return 150;
    case 'database':
      return 150;
    case 'annotation':
      return 180;
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
    case 'manualInput':
      return 88;
    case 'triangle':
      return 96;
    case 'database':
      return 96;
    case 'annotation':
      return 92;
    default:
      return 80;
  }
}

function getNextNodeZIndex(nodes: FlowChartNode[]): number {
  return nodes.reduce((max, node) => Math.max(max, node.zIndex ?? 0), 0) + 1;
}
