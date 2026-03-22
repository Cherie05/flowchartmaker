import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Circle,
  Diamond,
  Loader,
  Play,
  Square,
  Square as StopSquare
} from 'lucide-react';
import { ConnectionLine } from '../components/ConnectionLine';
import { Node } from '../components/Node';
import { EditorCanvasChrome } from '../components/editor/EditorCanvasChrome';
import { EditorSidebar } from '../components/editor/EditorSidebar';
import { EditorToolRail } from '../components/editor/EditorToolRail';
import { EditorTopBar } from '../components/editor/EditorTopBar';
import type { WorkspaceNodeType, WorkspaceTheme } from '../components/editor/types';
import { useFlowChart } from '../hooks/useFlowChart';
import { createId } from '../lib/createId';
import { getErrorMessage } from '../lib/errors';
import { aiService } from '../services/aiService';
import { flowchartService } from '../services/flowchartService';
import type { AIFlowChartResponse, Connection, FlowChartNode, NodeSide, Position } from '../types/flowChart';

const WORKSPACE_PADDING = 520;
const WORKSPACE_SAFE_LEFT = 420;
const WORKSPACE_SAFE_TOP = 320;
const MIN_WORKSPACE_WIDTH = 6400;
const MIN_WORKSPACE_HEIGHT = 4200;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.2;
const WORKSPACE_THEME_STORAGE_KEY = 'flowchart-workspace-theme';

export function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
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
    undo,
    redo,
    canUndo,
    canRedo,
    loadFlowChart
  } = useFlowChart();

  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; side: NodeSide } | null>(null);
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
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [workspaceTheme, setWorkspaceTheme] = useState<WorkspaceTheme>(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }

    return window.localStorage.getItem(WORKSPACE_THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
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

      const positionedNodes = ensureWorkspacePadding(data.nodes || []);

      loadFlowChart({
        id: data.id,
        name: data.name,
        nodes: positionedNodes,
        connections: data.connections || [],
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
    if (selectedConnection && !flowChart.connections.some((connection) => connection.id === selectedConnection)) {
      setSelectedConnection(null);
    }
  }, [flowChart.connections, selectedConnection]);

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
    if (e.target === e.currentTarget) {
      setSelectedNode(null);
      setSelectedConnection(null);
      setConnectingFrom(null);
    }
  };

  const handleCanvasDoubleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const position: Position = {
        x: Math.max(0, (e.clientX - rect.left) / zoomRef.current - 70),
        y: Math.max(0, (e.clientY - rect.top) / zoomRef.current - 40)
      };

      addNode('process', position);
    }
  };

  const handleNodeConnect = (nodeId: string, side: NodeSide) => {
    if (!connectingFrom) {
      setConnectingFrom({ nodeId, side });
      return;
    }

    if (connectingFrom.nodeId !== nodeId) {
      addConnection(connectingFrom.nodeId, nodeId, connectingFrom.side, side);
    }

    setConnectingFrom(null);
  };

  const handleExport = (format: 'png' | 'svg' | 'json') => {
    switch (format) {
      case 'json': {
        const exportData = { ...flowChart, name: flowchartName };
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${flowchartName.replace(/\s+/g, '_').trim() || 'flowchart'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        break;
      }
      case 'svg':
      case 'png':
        alert(`${format.toUpperCase()} export functionality would be implemented with canvas-to-image conversion`);
        break;
    }
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const importedFlowchart = parseImportedFlowChart(event.target?.result, flowchartName);
        const positionedNodes = ensureWorkspacePadding(importedFlowchart.nodes);

        replaceFlowChartContent({
          name: importedFlowchart.name,
          nodes: positionedNodes,
          connections: importedFlowchart.connections
        });
        setFlowchartName(importedFlowchart.name);
        setSelectedConnection(null);
        setConnectingFrom(null);
        setErrorMessage('');
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
      setConnectingFrom(null);
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
    setSelectedConnection(null);
    setConnectingFrom(null);
    scheduleScrollToNodes([]);
  };

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

    return {
      x: Math.max(96, Math.round(viewportCenterX - 70 + (column - 1) * 190)),
      y: Math.max(96, Math.round(viewportCenterY - 40 + (row - 0.5) * 150))
    };
  }, [flowChart.nodes.length]);

  const addNodeFromPalette = (type: FlowChartNode['type']) => {
    addNode(type, getSuggestedNodePosition());
  };

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
      type: 'end' as const,
      icon: StopSquare,
      label: 'End',
      description: 'Close the journey.',
      iconColor: 'text-rose-600',
      surfaceClass: 'border-rose-200 bg-rose-50'
    }
  ];

  const starterPrompts = [
    'Customer onboarding from signup to activation',
    'Bug triage workflow for a product team',
    'Order fulfillment with payment, packing, and shipping',
    'Hiring pipeline from application to offer'
  ];

  const selectedNodeData = flowChart.nodes.find((node) => node.id === selectedNode) ?? null;
  const selectedConnectionData =
    flowChart.connections.find((connection) => connection.id === selectedConnection) ?? null;
  const selectedConnectionEndpoints = selectedConnectionData
    ? {
        from: flowChart.nodes.find((node) => node.id === selectedConnectionData.from) ?? null,
        to: flowChart.nodes.find((node) => node.id === selectedConnectionData.to) ?? null
      }
    : null;
  const connectingNodeLabel = connectingFrom
    ? flowChart.nodes.find((node) => node.id === connectingFrom.nodeId)?.text || 'this node'
    : null;
  const workspaceMetrics = getWorkspaceMetrics(flowChart.nodes);
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

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

      if (isTypingTarget) {
        return;
      }

      if (event.key === '/') {
        event.preventDefault();
        focusAIComposer();
        return;
      }

      if (event.key === 'Escape') {
        setSelectedNode(null);
        setSelectedConnection(null);
        setConnectingFrom(null);
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedConnectionData) {
          deleteConnection(selectedConnectionData.id);
          setSelectedConnection(null);
          return;
        }

        if (selectedNodeData) {
          deleteNode(selectedNodeData.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    deleteConnection,
    deleteNode,
    focusAIComposer,
    handleManualSave,
    handleResetZoom,
    handleZoomIn,
    handleZoomOut,
    selectedConnectionData,
    selectedNodeData,
    setSelectedNode
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
        <EditorToolRail
          nodeTypes={nodeTypes}
          addNodeFromPalette={addNodeFromPalette}
          onFocusAI={focusAIComposer}
          onImport={() => fileInputRef.current?.click()}
          onExportJson={() => handleExport('json')}
          workspaceTheme={workspaceTheme}
        />

        <main className={`min-h-0 min-w-0 flex-1 ${mainClass}`}>
          <div className="flex h-full min-w-0 flex-col">
            <EditorTopBar
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
              isLinking={connectingFrom !== null}
              workspaceTheme={workspaceTheme}
              onThemeChange={setWorkspaceTheme}
            />

            <div className={`relative min-h-[560px] flex-1 overflow-hidden ${canvasShellClass}`}>
              <EditorCanvasChrome
                hasNodes={flowChart.nodes.length > 0}
                connectingNodeLabel={connectingNodeLabel}
                zoomLabel={zoomLabel}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                onFitCanvas={() => scheduleScrollToNodes(flowChart.nodes)}
                workspaceTheme={workspaceTheme}
              />

              <div
                ref={workspaceViewportRef}
                className={`h-full w-full overflow-auto ${
                  isPanning ? 'cursor-grabbing' : isSpacePressed ? 'cursor-grab' : 'cursor-default'
                }`}
                onMouseDown={handleWorkspacePanStart}
                onWheel={handleWorkspaceWheel}
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

                    <svg
                      className="absolute inset-0"
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
                            isSelected={selectedConnection === connection.id}
                            onSelect={() => {
                              setSelectedConnection(connection.id);
                              setSelectedNode(null);
                            }}
                            onDelete={() => {
                              deleteConnection(connection.id);
                              setSelectedConnection(null);
                            }}
                            workspaceTheme={workspaceTheme}
                          />
                        );
                      })}
                    </svg>

                    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 10 }}>
                      {flowChart.nodes.map((node) => (
                        <Node
                          key={node.id}
                          node={node}
                          isSelected={selectedNode === node.id}
                          isDragging={draggedNode === node.id}
                          zoom={zoom}
                          onSelect={() => {
                            setSelectedNode(node.id);
                            setSelectedConnection(null);
                          }}
                          onDragStart={() => startDrag(node.id)}
                          onDragEnd={endDrag}
                          onMove={(position) => moveNode(node.id, position)}
                          onTextChange={(text) => updateNode(node.id, { text })}
                          onDelete={() => deleteNode(node.id)}
                          onConnect={handleNodeConnect}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

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
          selectedConnectionData={selectedConnectionData}
          selectedConnectionEndpoints={selectedConnectionEndpoints}
          updateNodeText={(text) => {
            if (selectedNodeData) {
              updateNode(selectedNodeData.id, { text });
            }
          }}
          onDeleteSelectedNode={() => {
            if (selectedNodeData) {
              deleteNode(selectedNodeData.id);
            }
          }}
          onDeleteSelectedConnection={() => {
            if (selectedConnectionData) {
              deleteConnection(selectedConnectionData.id);
              setSelectedConnection(null);
            }
          }}
          onImport={() => fileInputRef.current?.click()}
          onExportJson={() => handleExport('json')}
          onExportPng={() => handleExport('png')}
          onExportSvg={() => handleExport('svg')}
          onClearBoard={handleClearAll}
          workspaceTheme={workspaceTheme}
        />
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
  const nodes = ensureWorkspacePadding(rawNodes);

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
  if (!nodes.length) {
    return nodes;
  }

  const bounds = getNodeBounds(nodes);
  const shiftX = Math.max(0, WORKSPACE_SAFE_LEFT - bounds.minX);
  const shiftY = Math.max(0, WORKSPACE_SAFE_TOP - bounds.minY);

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

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
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
    ...(typeof connection.label === 'string' && connection.label.trim()
      ? { label: connection.label.trim() }
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
    value === 'connector'
  );
}

function isNodeSide(value: unknown): value is NodeSide {
  return value === 'top' || value === 'right' || value === 'bottom' || value === 'left';
}

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
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
