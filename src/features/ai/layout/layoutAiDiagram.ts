import type { AiDiagram } from '../../../../shared/ai/aiDiagramSchema';

export interface AiLayoutPosition {
  x: number;
  y: number;
}

export interface AiLayoutOptions {
  originX?: number;
  originY?: number;
  horizontalGap?: number;
  verticalGap?: number;
}

export function layoutAiDiagram(
  diagram: AiDiagram,
  options: AiLayoutOptions = {},
): Map<string, AiLayoutPosition> {
  const originX = options.originX ?? 480;
  const originY = options.originY ?? 280;
  const horizontalGap = options.horizontalGap ?? 260;
  const verticalGap = options.verticalGap ?? 170;
  const keys = diagram.nodes.map((node) => node.key);
  const keyOrder = new Map(keys.map((key, index) => [key, index]));
  const outgoing = new Map(keys.map((key) => [key, [] as string[]]));
  const incoming = new Map(keys.map((key) => [key, [] as string[]]));

  for (const edge of diagram.edges) {
    outgoing.get(edge.from)?.push(edge.to);
    incoming.get(edge.to)?.push(edge.from);
  }

  const starts = diagram.nodes.filter((node) => node.kind === 'start').map((node) => node.key);
  const startSet = new Set(starts);
  const layers = new Map<string, number>();
  const queue = starts.map((key) => ({ key, layer: 0 }));
  const processedAt = new Map<string, number>();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const previous = processedAt.get(current.key);
    if (previous !== undefined && previous >= current.layer) continue;
    processedAt.set(current.key, current.layer);
    layers.set(current.key, Math.max(layers.get(current.key) ?? 0, current.layer));
    if (current.layer >= keys.length) continue;
    for (const child of outgoing.get(current.key) ?? []) {
      if (startSet.has(child)) continue;
      queue.push({ key: child, layer: current.layer + 1 });
    }
  }

  for (const key of keys) {
    if (!layers.has(key)) layers.set(key, 0);
  }

  const maxNonEndLayer = Math.max(0, ...diagram.nodes
    .filter((node) => node.kind !== 'end')
    .map((node) => layers.get(node.key) ?? 0));
  for (const node of diagram.nodes) {
    if (node.kind === 'end') {
      const parentLayer = Math.max(-1, ...(incoming.get(node.key) ?? []).map((key) => layers.get(key) ?? 0));
      layers.set(node.key, Math.max(layers.get(node.key) ?? 0, parentLayer + 1, maxNonEndLayer + 1));
    }
  }

  const grouped = new Map<number, string[]>();
  for (const key of keys) {
    const layer = layers.get(key) ?? 0;
    const group = grouped.get(layer) ?? [];
    group.push(key);
    grouped.set(layer, group);
  }

  const positions = new Map<string, AiLayoutPosition>();
  const orderedLayers = [...grouped.keys()].sort((a, b) => a - b);
  for (const layer of orderedLayers) {
    const group = grouped.get(layer) ?? [];
    group.sort((left, right) => {
      const leftParent = averageParentX(left, incoming, positions);
      const rightParent = averageParentX(right, incoming, positions);
      if (leftParent !== rightParent) return leftParent - rightParent;
      return (keyOrder.get(left) ?? 0) - (keyOrder.get(right) ?? 0);
    });
    const width = (group.length - 1) * horizontalGap;
    group.forEach((key, index) => {
      positions.set(key, {
        x: originX - width / 2 + index * horizontalGap,
        y: originY + layer * verticalGap,
      });
    });
  }

  return positions;
}

function averageParentX(
  key: string,
  incoming: Map<string, string[]>,
  positions: Map<string, AiLayoutPosition>,
): number {
  const parentPositions = (incoming.get(key) ?? [])
    .map((parent) => positions.get(parent)?.x)
    .filter((x): x is number => x !== undefined);
  if (parentPositions.length === 0) return Number.POSITIVE_INFINITY;
  return parentPositions.reduce((sum, x) => sum + x, 0) / parentPositions.length;
}
