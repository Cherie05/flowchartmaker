import type { AiDiagram, AiDiagramEdge } from '../../../../shared/ai/aiDiagramSchema';

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

/**
 * Identifies back-edges (edges closing a cycle) with a depth-first search.
 * Layering must ignore them: a retry loop points backwards in the flow, so
 * counting it as forward progress unrolls the cycle and inflates depth.
 */
function findBackEdgeKeys(diagram: AiDiagram): Set<string> {
  const outgoing = new Map<string, AiDiagramEdge[]>(diagram.nodes.map((node) => [node.key, []]));
  for (const edge of diagram.edges) {
    outgoing.get(edge.from)?.push(edge);
  }

  const VISITING = 1;
  const DONE = 2;
  const state = new Map<string, number>();
  const backEdgeKeys = new Set<string>();

  const visit = (key: string) => {
    state.set(key, VISITING);
    for (const edge of outgoing.get(key) ?? []) {
      const targetState = state.get(edge.to);
      if (targetState === VISITING) {
        backEdgeKeys.add(edge.key);
      } else if (targetState === undefined) {
        visit(edge.to);
      }
    }
    state.set(key, DONE);
  };

  // Start nodes first so cycles are cut at the edge that points backwards
  // relative to the natural flow, then sweep up anything unreachable.
  for (const node of diagram.nodes) {
    if (node.kind === 'start' && state.get(node.key) === undefined) visit(node.key);
  }
  for (const node of diagram.nodes) {
    if (state.get(node.key) === undefined) visit(node.key);
  }

  return backEdgeKeys;
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

  const backEdgeKeys = findBackEdgeKeys(diagram);
  const forwardEdges = diagram.edges.filter((edge) => !backEdgeKeys.has(edge.key));
  const outgoing = new Map<string, AiDiagramEdge[]>(keys.map((key) => [key, []]));
  const incoming = new Map<string, AiDiagramEdge[]>(keys.map((key) => [key, []]));
  for (const edge of forwardEdges) {
    outgoing.get(edge.from)?.push(edge);
    incoming.get(edge.to)?.push(edge);
  }

  // Longest-path layering over the remaining DAG via topological order.
  const indegree = new Map(keys.map((key) => [key, incoming.get(key)?.length ?? 0]));
  const layers = new Map(keys.map((key) => [key, 0]));
  const queue = keys.filter((key) => (indegree.get(key) ?? 0) === 0);
  while (queue.length > 0) {
    const key = queue.shift();
    if (!key) continue;
    for (const edge of outgoing.get(key) ?? []) {
      layers.set(edge.to, Math.max(layers.get(edge.to) ?? 0, (layers.get(key) ?? 0) + 1));
      const remaining = (indegree.get(edge.to) ?? 0) - 1;
      indegree.set(edge.to, remaining);
      if (remaining === 0) queue.push(edge.to);
    }
  }

  // Keep terminal states below the work that leads into them.
  const maxNonEndLayer = Math.max(0, ...diagram.nodes
    .filter((node) => node.kind !== 'end')
    .map((node) => layers.get(node.key) ?? 0));
  for (const node of diagram.nodes) {
    if (node.kind === 'end') {
      const parentLayer = Math.max(-1, ...(incoming.get(node.key) ?? []).map((edge) => layers.get(edge.from) ?? 0));
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
  incoming: Map<string, AiDiagramEdge[]>,
  positions: Map<string, AiLayoutPosition>,
): number {
  const parentPositions = (incoming.get(key) ?? [])
    .map((edge) => positions.get(edge.from)?.x)
    .filter((x): x is number => x !== undefined);
  if (parentPositions.length === 0) return Number.POSITIVE_INFINITY;
  return parentPositions.reduce((sum, x) => sum + x, 0) / parentPositions.length;
}
