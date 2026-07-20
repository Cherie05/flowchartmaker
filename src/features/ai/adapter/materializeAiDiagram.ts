import type { AiDiagram, AiDiagramNode } from '../../../../shared/ai/aiDiagramSchema';
import { getNodeDefaults } from '../../editor/domain/nodeDefaults';
import {
  AVERAGE_GLYPH_RATIO,
  LINE_HEIGHT_RATIO,
  NODE_TEXT_PADDING,
  charsPerLineAt,
  estimateWrappedLines,
  toPlainLabel,
} from '../../editor/domain/textFit';
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
    const { width, height } = fitNodeToLabel(source.label, defaults.width, defaults.height);
    return {
      id,
      type,
      position: { ...position },
      text: source.label,
      width,
      height,
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

/**
 * Grows a node past its default size when the generated label needs the room.
 * Model labels are routinely longer than the hand-placed defaults assume, and
 * a fixed box makes that text wrap out of the shape.
 */
function fitNodeToLabel(label: string, defaultWidth: number, defaultHeight: number): { width: number; height: number } {
  const text = toPlainLabel(label);
  if (!text) return { width: defaultWidth, height: defaultHeight };

  const TARGET_FONT_SIZE = 13;
  const MAX_WIDTH = 240;

  // Widen up to the cap so long labels get fewer, shorter lines, then give the
  // box whatever height those wrapped lines actually need at the target size.
  const singleLineWidth = text.length * TARGET_FONT_SIZE * AVERAGE_GLYPH_RATIO + NODE_TEXT_PADDING;
  const width = Math.round(Math.min(MAX_WIDTH, Math.max(defaultWidth, singleLineWidth / 2)));
  const lines = estimateWrappedLines(text, charsPerLineAt(TARGET_FONT_SIZE, width));
  const height = Math.round(
    Math.max(defaultHeight, lines * TARGET_FONT_SIZE * LINE_HEIGHT_RATIO + NODE_TEXT_PADDING + 8),
  );

  return { width, height };
}

export function getAddToDiagramOrigin(existingNodes: FlowChartNode[]): Pick<AiLayoutOptions, 'originX' | 'originY'> {
  if (existingNodes.length === 0) return { originX: 480, originY: 280 };
  const rightEdge = Math.max(...existingNodes.map((node) => node.position.x + node.width));
  const topEdge = Math.min(...existingNodes.map((node) => node.position.y));
  return { originX: rightEdge + 380, originY: Math.max(180, topEdge) };
}
