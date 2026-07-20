import type { AiDiagram } from '../../../../shared/ai/aiDiagramSchema';
import type { Connection, FlowChartNode } from '../../../types/flowChart';
import { materializeAiDiagram } from './materializeAiDiagram';

export interface AppliedAiEdit {
  nodes: FlowChartNode[];
  connections: Connection[];
  insertedNodeIds: string[];
}

/**
 * Removes the selected nodes/connections and splices in the AI-returned replacement
 * fragment. Connections that crossed the selection boundary are reattached to the
 * fragment's first start (incoming) or first end (outgoing) node rather than dropped.
 */
export function applyAiEditToDiagram(
  currentNodes: FlowChartNode[],
  currentConnections: Connection[],
  selectedNodeIds: string[],
  fragment: AiDiagram,
): AppliedAiEdit {
  const selectedIdSet = new Set(selectedNodeIds);
  const selectedNodes = currentNodes.filter((node) => selectedIdSet.has(node.id));

  const origin = centroid(selectedNodes);
  const generated = materializeAiDiagram(fragment, { originX: origin.x, originY: origin.y });
  const entryNode = generated.nodes.find((node) => node.type === 'start') ?? generated.nodes[0];
  const exitNode = generated.nodes.find((node) => node.type === 'end') ?? generated.nodes[generated.nodes.length - 1];

  const unaffectedConnections = currentConnections.filter(
    (connection) => !selectedIdSet.has(connection.from) && !selectedIdSet.has(connection.to),
  );
  const incomingBoundary = currentConnections
    .filter((connection) => !selectedIdSet.has(connection.from) && selectedIdSet.has(connection.to))
    .map((connection): Connection => ({ ...connection, to: entryNode.id }));
  const outgoingBoundary = currentConnections
    .filter((connection) => selectedIdSet.has(connection.from) && !selectedIdSet.has(connection.to))
    .map((connection): Connection => ({ ...connection, from: exitNode.id }));

  return {
    nodes: [...currentNodes.filter((node) => !selectedIdSet.has(node.id)), ...generated.nodes],
    connections: [...unaffectedConnections, ...incomingBoundary, ...outgoingBoundary, ...generated.connections],
    insertedNodeIds: generated.nodes.map((node) => node.id),
  };
}

function centroid(nodes: FlowChartNode[]): { x: number; y: number } {
  if (nodes.length === 0) return { x: 480, y: 280 };
  const sum = nodes.reduce(
    (total, node) => ({
      x: total.x + node.position.x + node.width / 2,
      y: total.y + node.position.y + node.height / 2,
    }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / nodes.length, y: sum.y / nodes.length };
}
