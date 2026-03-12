import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Node } from '../components/Node';
import { ConnectionLine } from '../components/ConnectionLine';
import { useFlowChart } from '../hooks/useFlowChart';
import { flowchartService } from '../services/flowchartService';
import { aiService } from '../services/aiService';
import { Position, FlowChartNode } from '../types/flowChart';
import {
  Square,
  Diamond,
  Play,
  Square as StopSquare,
  Bot,
  Download,
  Upload,
  Trash2,
  Undo,
  Redo,
  Loader,
  Circle,
  ArrowLeft,
  Save,
  Check
} from 'lucide-react';

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
    undo,
    redo,
    canUndo,
    canRedo,
    loadFlowChart
  } = useFlowChart();

  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; side: 'top' | 'right' | 'bottom' | 'left' } | null>(null);
  const [aiDescription, setAiDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flowchartName, setFlowchartName] = useState('Untitled Flowchart');
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (id) {
      loadExistingFlowchart();
    } else {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!loading && id) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 2000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [flowChart.nodes, flowChart.connections, flowchartName, loading]);

  const loadExistingFlowchart = async () => {
    try {
      setLoading(true);
      const data = await flowchartService.getFlowchartById(id!);
      if (data) {
        loadFlowChart({
          id: data.id,
          name: data.name,
          nodes: data.nodes || [],
          connections: data.connections || [],
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        });
        setFlowchartName(data.name);
      }
    } catch (error) {
      console.error('Failed to load flowchart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSave = async () => {
    if (!id) return;

    try {
      await flowchartService.updateFlowchart(id, {
        name: flowchartName,
        nodes: flowChart.nodes,
        connections: flowChart.connections
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleManualSave = async () => {
    if (!id) return;

    try {
      setIsSaving(true);
      await flowchartService.updateFlowchart(id, {
        name: flowchartName,
        nodes: flowChart.nodes,
        connections: flowChart.connections
      });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedNode(null);
      setSelectedConnection(null);
      setConnectingFrom(null);
    }
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const position: Position = {
        x: Math.max(0, e.clientX - rect.left - 70),
        y: Math.max(0, e.clientY - rect.top - 40)
      };
      addNode('process', position);
    }
  };

  const handleNodeConnect = (nodeId: string, side: 'top' | 'right' | 'bottom' | 'left') => {
    if (!connectingFrom) {
      setConnectingFrom({ nodeId, side });
    } else {
      if (connectingFrom.nodeId !== nodeId) {
        addConnection(
          connectingFrom.nodeId,
          nodeId,
          connectingFrom.side,
          side
        );
      }
      setConnectingFrom(null);
    }
  };

  const handleExport = (format: 'png' | 'svg' | 'json') => {
    switch (format) {
      case 'json':
        const dataStr = JSON.stringify(flowChart, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${flowChart.name.replace(/\s+/g, '_')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        break;
      case 'svg':
      case 'png':
        alert(`${format.toUpperCase()} export functionality would be implemented with canvas-to-image conversion`);
        break;
    }
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported.nodes && Array.isArray(imported.nodes)) {
          clearAll();

          const nodeIdMap = new Map();
          imported.nodes.forEach((nodeData: any) => {
            const oldId = nodeData.id;
            const newPosition = {
              x: nodeData.position?.x || 100,
              y: nodeData.position?.y || 100
            };
            addNode(nodeData.type || 'process', newPosition);

            setTimeout(() => {
              const newNode = flowChart.nodes[flowChart.nodes.length - 1];
              if (newNode) {
                nodeIdMap.set(oldId, newNode.id);
                updateNode(newNode.id, { text: nodeData.text || 'Imported Node' });
              }
            }, 100);
          });

          if (imported.connections && Array.isArray(imported.connections)) {
            setTimeout(() => {
              imported.connections.forEach((connData: any) => {
                const fromId = nodeIdMap.get(connData.from);
                const toId = nodeIdMap.get(connData.to);
                if (fromId && toId) {
                  addConnection(fromId, toId, connData.fromSide, connData.toSide);
                }
              });
            }, 500);
          }
        }
      } catch (error) {
        alert('Invalid file format. Please select a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleAIGenerate = async () => {
    if (!aiDescription.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const result = await aiService.generateFlowChart({
        description: aiDescription,
        style: 'simple'
      });

      clearAll();

      const nodeIds: string[] = [];
      result.nodes.forEach((nodeData, index) => {
        setTimeout(() => {
          addNode(nodeData.type, nodeData.position);

          setTimeout(() => {
            const currentNodes = flowChart.nodes;
            const newNode = currentNodes[currentNodes.length - 1];
            if (newNode) {
              updateNode(newNode.id, { text: nodeData.text });
              nodeIds.push(newNode.id);
            }
          }, 50);
        }, index * 100);
      });

      setTimeout(() => {
        result.connections.forEach((connData, index) => {
          if (nodeIds[index] && nodeIds[index + 1]) {
            addConnection(nodeIds[index], nodeIds[index + 1], connData.fromSide, connData.toSide);
          }
        });
      }, result.nodes.length * 100 + 200);

      setAiDescription('');
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('Failed to generate flow chart. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const nodeTypes = [
    { type: 'start' as const, icon: Play, label: 'Start', color: 'text-green-600' },
    { type: 'process' as const, icon: Square, label: 'Process', color: 'text-blue-600' },
    { type: 'decision' as const, icon: Diamond, label: 'Decision', color: 'text-yellow-600' },
    { type: 'connector' as const, icon: Circle, label: 'Connector', color: 'text-purple-600' },
    { type: 'end' as const, icon: StopSquare, label: 'End', color: 'text-red-600' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-80 bg-white border-r border-gray-200 h-full flex flex-col shadow-lg">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-3 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <input
            type="text"
            value={flowchartName}
            onChange={(e) => setFlowchartName(e.target.value)}
            className="w-full text-xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          />

          <button
            onClick={handleManualSave}
            disabled={isSaving || !id}
            className="w-full mt-3 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
          >
            {justSaved ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : isSaving ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">AI Generation</h3>
            </div>

            <div className="space-y-3">
              <textarea
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder="Describe your flow chart (e.g., 'user registration process' or 'order processing workflow')"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isGenerating}
              />

              <button
                onClick={handleAIGenerate}
                disabled={!aiDescription.trim() || isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4" />
                    Generate Flow Chart
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Add Nodes</h3>
            <div className="grid grid-cols-2 gap-2">
              {nodeTypes.map(({ type, icon: Icon, label, color }) => (
                <button
                  key={type}
                  onClick={() => {
                    const position = {
                      x: 100 + Math.random() * 300,
                      y: 100 + Math.random() * 300
                    };
                    addNode(type, position);
                  }}
                  className="flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200"
                >
                  <Icon className={`h-6 w-6 ${color}`} />
                  <span className="text-xs font-medium text-gray-700">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Actions</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg transition-colors duration-200"
                >
                  <Undo className="h-4 w-4" />
                  Undo
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg transition-colors duration-200"
                >
                  <Redo className="h-4 w-4" />
                  Redo
                </button>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                <Upload className="h-4 w-4" />
                Import JSON
              </button>

              <button
                onClick={() => handleExport('json')}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                <Download className="h-4 w-4" />
                Export JSON
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleExport('png')}
                  className="flex items-center justify-center gap-1 py-2 px-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors duration-200"
                >
                  <Download className="h-4 w-4" />
                  PNG
                </button>
                <button
                  onClick={() => handleExport('svg')}
                  className="flex items-center justify-center gap-1 py-2 px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors duration-200"
                >
                  <Download className="h-4 w-4" />
                  SVG
                </button>
              </div>

              <button
                onClick={clearAll}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <div
          ref={canvasRef}
          id="flowchart-canvas"
          className="w-full h-full bg-gray-50 relative overflow-hidden"
          onClick={handleCanvasClick}
          onDoubleClick={handleCanvasDoubleClick}
        >
          <div className="absolute inset-0 opacity-30">
            <svg width="100%" height="100%" className="absolute inset-0">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 5 }}>
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
                <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
              </marker>
            </defs>
            {flowChart.connections.map(connection => {
              const fromNode = flowChart.nodes.find(n => n.id === connection.from);
              const toNode = flowChart.nodes.find(n => n.id === connection.to);

              if (!fromNode || !toNode) return null;

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
                  onDelete={() => deleteConnection(connection.id)}
                />
              );
            })}
          </svg>

          <div className="absolute inset-0" style={{ zIndex: 10 }}>
            {flowChart.nodes.map(node => (
              <Node
                key={node.id}
                node={node}
                isSelected={selectedNode === node.id}
                isDragging={draggedNode === node.id}
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

          {flowChart.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 20 }}>
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 text-center shadow-xl border border-gray-200 max-w-md">
                <Bot className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Start Creating</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Use AI to generate a flow chart, or double-click anywhere to add a node manually.
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>• Use AI to describe your process</p>
                  <p>• Double-click to add nodes</p>
                  <p>• Click blue dots to connect nodes</p>
                  <p>• Double-click nodes to edit text</p>
                </div>
              </div>
            </div>
          )}

          {connectingFrom && (
            <div className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-pulse" style={{ zIndex: 30 }}>
              Click a blue connection point on another node to create a link
            </div>
          )}

          {flowChart.nodes.length > 0 && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-sm text-gray-600 shadow-md" style={{ zIndex: 30 }}>
              {flowChart.nodes.length} node{flowChart.nodes.length !== 1 ? 's' : ''} • {flowChart.connections.length} connection{flowChart.connections.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
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
