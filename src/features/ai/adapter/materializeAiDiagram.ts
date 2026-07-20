import type { AiDiagram, AiDiagramNode } from '../../../../shared/ai/aiDiagramSchema';
import { getNodeDefaults } from '../../editor/domain/nodeDefaults';
import { createId } from '../../../lib/createId';
import type { Connection, FlowChartNode, FlowChartNodeType } from '../../../types/flowChart';
import { layoutAiDiagram, type AiLayoutOptions } from '../layout/layoutAiDiagram';

const NODE_TYPE_MAP: Record<AiDiagramNode['kind'], FlowChartNodeType> = {
  start: 'start',
  process: 'process',
  decision: 'decision',
  inputOutput: 'input',
  end: 'end',
};

export interface MaterializedAiDiagram {
  title: string;
  summary: string;
  nodes: FlowChartNode[];
  connections: Connection[];
}

export function materializeAiDiagram(
  diagram: AiDiagram,
  layoutOptions: AiLayoutOptions = {},
): MaterializedAiDiagram {
  const positions = layoutAiDiagram(diagram, layoutOptions);
  const idByKey = new Map<string, string>();
  const nodes = diagram.nodes.map((source): FlowChartNode => {
    const type = NODE_TYPE_MAP[source.kind];
    const defaults = getNodeDefaults(type);
    const position = positions.get(source.key);
    if (!position) throw new Error(`AI node ${source.key} does not have a layout position`);
    const id = createId('ai-node');
    idByKey.set(source.key, id);
    return {
      id,
      type,
      position: { ...position },
      text: source.label,
      width: defaults.width,
      height: defaults.height,
      style: defaults.style,
    };
  });

  const connections = diagram.edges.map((source): Connection => {
    const from = idByKey.get(source.from);
    const to = idByKey.get(source.to);
    if (!from || !to) throw new Error(`AI edge ${source.key} references an unknown node`);

    // A retry/back edge points to a node at or above its source. Routing it
    // bottom-to-top would draw it straight back through the forward flow, so
    // send it around the side instead.
    const fromPosition = positions.get(source.from);
    const toPosition = positions.get(source.to);
    const isBackEdge = Boolean(fromPosition && toPosition && toPosition.y <= fromPosition.y);

    return {
      id: createId('ai-edge'),
      from,
      to,
      fromSide: isBackEdge ? 'right' : 'bottom',
      toSide: isBackEdge ? 'right' : 'top',
      label: source.label || undefined,
      type: 'elbow',
      endMarker: 'arrow',
    };
  });

  return { title: diagram.title, summary: diagram.summary, nodes, connections };
}

export function getAddToDiagramOrigin(existingNodes: FlowChartNode[]): Pick<AiLayoutOptions, 'originX' | 'originY'> {
  if (existingNodes.length === 0) return { originX: 480, originY: 280 };
  const rightEdge = Math.max(...existingNodes.map((node) => node.position.x + node.width));
  const topEdge = Math.min(...existingNodes.map((node) => node.position.y));
  return { originX: rightEdge + 380, originY: Math.max(180, topEdge) };
}
