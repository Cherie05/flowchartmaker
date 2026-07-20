import { useMemo } from 'react';
import type { AiDiagram } from '../../../../shared/ai/aiDiagramSchema';
import { layoutAiDiagram } from '../layout/layoutAiDiagram';

export function AiDiagramPreview({ diagram }: { diagram: AiDiagram }) {
  const preview = useMemo(() => {
    const positions = layoutAiDiagram(diagram, { originX: 0, originY: 0, horizontalGap: 190, verticalGap: 110 });
    const points = [...positions.values()];
    const minX = Math.min(...points.map((point) => point.x)) - 70;
    const maxX = Math.max(...points.map((point) => point.x)) + 70;
    const maxY = Math.max(...points.map((point) => point.y)) + 45;
    return { positions, viewBox: `${minX} -45 ${Math.max(140, maxX - minX)} ${Math.max(90, maxY + 45)}` };
  }, [diagram]);
  return <svg role="img" aria-label={`Preview of ${diagram.title}`} viewBox={preview.viewBox} className="mt-5 h-56 w-full rounded-xl border border-slate-200 bg-white">
    {diagram.edges.map((edge) => { const from = preview.positions.get(edge.from); const to = preview.positions.get(edge.to); return from && to ? <line key={edge.key} x1={from.x} y1={from.y + 18} x2={to.x} y2={to.y - 18} stroke="#94a3b8" strokeWidth="2" /> : null; })}
    {diagram.nodes.map((node) => { const point = preview.positions.get(node.key); if (!point) return null; return <g key={node.key} transform={`translate(${point.x - 58} ${point.y - 18})`}><rect width="116" height="36" rx={node.kind === 'start' || node.kind === 'end' ? 18 : 8} fill={node.kind === 'decision' ? '#f5f3ff' : '#ffffff'} stroke={node.kind === 'decision' ? '#7c3aed' : '#94a3b8'} /><text x="58" y="22" textAnchor="middle" fontSize="10" fill="#334155">{node.label.length > 18 ? `${node.label.slice(0, 17)}…` : node.label}</text></g>; })}
  </svg>;
}
