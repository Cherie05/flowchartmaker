import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import type { FlowChartNode } from '../../types/flowChart';
import type { WorkspaceTheme } from './types';

interface EditorMinimapProps {
  nodes: FlowChartNode[];
  workspaceWidth: number;
  workspaceHeight: number;
  viewportScrollLeft: number;
  viewportScrollTop: number;
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  workspaceTheme: WorkspaceTheme;
  onNavigate: (workspaceX: number, workspaceY: number) => void;
}

const MINIMAP_WIDTH = 188;
const MAX_MINIMAP_HEIGHT = 196;
const MINIMAP_PADDING = 220;

export function EditorMinimap({
  nodes,
  workspaceWidth,
  workspaceHeight,
  viewportScrollLeft,
  viewportScrollTop,
  viewportWidth,
  viewportHeight,
  zoom,
  workspaceTheme,
  onNavigate
}: EditorMinimapProps) {
  const isDark = workspaceTheme === 'dark';
  const [mapSize, setMapSize] = useState<{ width: number; height: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setMapSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  const workspaceViewport = {
    x: viewportScrollLeft / zoom,
    y: viewportScrollTop / zoom,
    width: viewportWidth / zoom,
    height: viewportHeight / zoom
  };
  const contentFrame = getContentFrame(nodes, workspaceViewport, workspaceWidth, workspaceHeight);
  
  const defaultScale = Math.min(MINIMAP_WIDTH / contentFrame.width, MAX_MINIMAP_HEIGHT / contentFrame.height);
  const defaultWidth = Math.max(136, Math.round(contentFrame.width * defaultScale));
  const defaultHeight = Math.max(112, Math.round(contentFrame.height * defaultScale));

  const minimapWidth = mapSize ? mapSize.width : defaultWidth;
  const minimapHeight = mapSize ? mapSize.height : defaultHeight;

  const scaleX = minimapWidth / contentFrame.width;
  const scaleY = minimapHeight / contentFrame.height;
  const viewportRect = {
    x: (workspaceViewport.x - contentFrame.minX) * scaleX,
    y: (workspaceViewport.y - contentFrame.minY) * scaleY,
    width: workspaceViewport.width * scaleX,
    height: workspaceViewport.height * scaleY
  };

  const handleNavigate = (event: ReactMouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const workspaceX = contentFrame.minX + localX / scaleX;
    const workspaceY = contentFrame.minY + localY / scaleY;
    onNavigate(workspaceX, workspaceY);
  };

  return (
    <div
      style={{ resize: 'both', overflow: 'hidden', minWidth: '180px', minHeight: '160px', maxWidth: '80vw', maxHeight: '80vh' }}
      className={`absolute bottom-24 right-6 z-30 hidden flex-col rounded-[24px] border p-3 shadow-xl backdrop-blur md:flex ${
        isDark
          ? 'border-white/10 bg-[#1a1c21]/92 shadow-black/30'
          : 'border-white/80 bg-white/90 shadow-[0_20px_45px_-30px_rgba(148,163,184,0.55)]'
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Minimap</p>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Large board overview</p>
        </div>
        <div className={`rounded-full px-2 py-1 text-[11px] font-semibold ${isDark ? 'bg-white/[0.05] text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
          {nodes.length}
        </div>
      </div>

      <div
        ref={mapRef}
        className={`relative flex-1 overflow-hidden rounded-[18px] border ${
          isDark ? 'border-white/10 bg-[#111318]' : 'border-slate-200 bg-[#f8f4eb]'
        }`}
        style={mapSize ? undefined : { width: defaultWidth, height: defaultHeight }}
        onMouseDown={handleNavigate}
      >
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: isDark
              ? 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)'
              : 'linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)',
            backgroundSize: '12px 12px'
          }}
        />

        {nodes.map((node) => (
          <div
            key={node.id}
            className={`absolute rounded-[4px] border ${
              isDark ? 'border-sky-300/25 bg-sky-400/20' : 'border-sky-300/60 bg-sky-300/30'
            }`}
            style={{
              left: (node.position.x - contentFrame.minX) * scaleX,
              top: (node.position.y - contentFrame.minY) * scaleY,
              width: Math.max(4, node.width * scaleX),
              height: Math.max(4, node.height * scaleY)
            }}
          />
        ))}

        <div
          className="absolute rounded-[10px] border-2 border-sky-400/90 bg-sky-400/10 shadow-[0_0_0_1px_rgba(14,165,233,0.2)]"
          style={{
            left: viewportRect.x,
            top: viewportRect.y,
            width: Math.max(14, viewportRect.width),
            height: Math.max(14, viewportRect.height)
          }}
        />
      </div>
    </div>
  );
}

function getContentFrame(
  nodes: FlowChartNode[],
  viewport: { x: number; y: number; width: number; height: number },
  workspaceWidth: number,
  workspaceHeight: number
) {
  const nodeBounds = nodes.length
    ? nodes.reduce(
        (bounds, node) => ({
          minX: Math.min(bounds.minX, node.position.x),
          minY: Math.min(bounds.minY, node.position.y),
          maxX: Math.max(bounds.maxX, node.position.x + node.width),
          maxY: Math.max(bounds.maxY, node.position.y + node.height)
        }),
        {
          minX: Number.POSITIVE_INFINITY,
          minY: Number.POSITIVE_INFINITY,
          maxX: Number.NEGATIVE_INFINITY,
          maxY: Number.NEGATIVE_INFINITY
        }
      )
    : {
        minX: viewport.x,
        minY: viewport.y,
        maxX: viewport.x + viewport.width,
        maxY: viewport.y + viewport.height
      };

  const minX = Math.max(0, Math.min(nodeBounds.minX, viewport.x) - MINIMAP_PADDING);
  const minY = Math.max(0, Math.min(nodeBounds.minY, viewport.y) - MINIMAP_PADDING);
  const maxX = Math.min(
    workspaceWidth,
    Math.max(nodeBounds.maxX, viewport.x + viewport.width) + MINIMAP_PADDING
  );
  const maxY = Math.min(
    workspaceHeight,
    Math.max(nodeBounds.maxY, viewport.y + viewport.height) + MINIMAP_PADDING
  );

  return {
    minX,
    minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY)
  };
}
