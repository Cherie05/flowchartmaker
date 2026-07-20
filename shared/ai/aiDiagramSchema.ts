import { z } from 'zod';

export const AI_DIAGRAM_LIMITS = {
  maxNodes: 25,
  maxEdges: 40,
  maxTitleLength: 120,
  maxSummaryLength: 500,
  maxAssumptions: 8,
  maxAssumptionLength: 180,
  maxLabelLength: 80,
  maxDescriptionLength: 300,
  maxEdgeLabelLength: 40,
} as const;

const KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
const HTML_PATTERN = /<\/?[A-Za-z][^>]*>|&(?:#\d+|#x[\da-f]+|[A-Za-z]+);/i;

function plainText(maxLength: number, allowEmpty = false) {
  const schema = z.string().trim().max(maxLength).refine((value) => !HTML_PATTERN.test(value), {
    message: 'HTML is not allowed',
  });
  return allowEmpty ? schema : schema.min(1);
}

export const aiNodeKindSchema = z.enum(['start', 'process', 'decision', 'inputOutput', 'end']);

export const aiDiagramNodeSchema = z.object({
  key: z.string().regex(KEY_PATTERN, 'Node keys must be stable alphanumeric identifiers'),
  kind: aiNodeKindSchema,
  label: plainText(AI_DIAGRAM_LIMITS.maxLabelLength),
  description: plainText(AI_DIAGRAM_LIMITS.maxDescriptionLength, true),
}).strict();

export const aiDiagramEdgeSchema = z.object({
  key: z.string().regex(KEY_PATTERN, 'Edge keys must be stable alphanumeric identifiers'),
  from: z.string().regex(KEY_PATTERN),
  to: z.string().regex(KEY_PATTERN),
  label: plainText(AI_DIAGRAM_LIMITS.maxEdgeLabelLength, true),
}).strict();

const structuralAiDiagramSchema = z.object({
  schemaVersion: z.literal('1.0'),
  title: plainText(AI_DIAGRAM_LIMITS.maxTitleLength),
  summary: plainText(AI_DIAGRAM_LIMITS.maxSummaryLength),
  assumptions: z.array(plainText(AI_DIAGRAM_LIMITS.maxAssumptionLength)).max(AI_DIAGRAM_LIMITS.maxAssumptions).default([]),
  nodes: z.array(aiDiagramNodeSchema).min(2).max(AI_DIAGRAM_LIMITS.maxNodes),
  edges: z.array(aiDiagramEdgeSchema).min(1).max(AI_DIAGRAM_LIMITS.maxEdges),
}).strict();

export const aiDiagramSchema = structuralAiDiagramSchema.superRefine((diagram, context) => {
  const nodeByKey = new Map(diagram.nodes.map((node) => [node.key, node]));
  const nodeKeys = new Set<string>();
  const edgeKeys = new Set<string>();
  const edgePairs = new Set<string>();
  const outgoing = new Map<string, typeof diagram.edges>();
  const incoming = new Map<string, typeof diagram.edges>();

  for (const node of diagram.nodes) {
    if (nodeKeys.has(node.key)) {
      context.addIssue({ code: 'custom', path: ['nodes'], message: `Duplicate node key: ${node.key}` });
    }
    nodeKeys.add(node.key);
    outgoing.set(node.key, []);
    incoming.set(node.key, []);
  }

  for (const edge of diagram.edges) {
    if (edgeKeys.has(edge.key)) {
      context.addIssue({ code: 'custom', path: ['edges'], message: `Duplicate edge key: ${edge.key}` });
    }
    edgeKeys.add(edge.key);

    if (!nodeByKey.has(edge.from) || !nodeByKey.has(edge.to)) {
      context.addIssue({ code: 'custom', path: ['edges'], message: `Edge ${edge.key} references an unknown node` });
      continue;
    }
    if (edge.from === edge.to) {
      context.addIssue({ code: 'custom', path: ['edges'], message: `Edge ${edge.key} cannot reference itself` });
      continue;
    }

    const pair = `${edge.from}\u0000${edge.to}`;
    if (edgePairs.has(pair)) {
      context.addIssue({ code: 'custom', path: ['edges'], message: `Duplicate edge: ${edge.from} to ${edge.to}` });
    }
    edgePairs.add(pair);
    outgoing.get(edge.from)?.push(edge);
    incoming.get(edge.to)?.push(edge);
  }

  const starts = diagram.nodes.filter((node) => node.kind === 'start');
  const ends = diagram.nodes.filter((node) => node.kind === 'end');
  if (starts.length === 0) {
    context.addIssue({ code: 'custom', path: ['nodes'], message: 'At least one start node is required' });
  }
  if (ends.length === 0) {
    context.addIssue({ code: 'custom', path: ['nodes'], message: 'At least one end node is required' });
  }

  for (const node of diagram.nodes) {
    if ((outgoing.get(node.key)?.length ?? 0) === 0 && (incoming.get(node.key)?.length ?? 0) === 0) {
      context.addIssue({ code: 'custom', path: ['nodes'], message: `Node ${node.key} is isolated` });
    }
    if (node.kind === 'decision') {
      const branches = outgoing.get(node.key) ?? [];
      if (branches.length < 2) {
        context.addIssue({ code: 'custom', path: ['edges'], message: `Decision ${node.key} needs at least two outgoing paths` });
      }
      const labels = branches.map((edge) => edge.label.trim().toLocaleLowerCase());
      if (labels.some((label) => label.length === 0) || new Set(labels).size !== labels.length) {
        context.addIssue({ code: 'custom', path: ['edges'], message: `Decision ${node.key} needs distinct, understandable branch labels` });
      }
    }
  }

  if (starts.length > 0) {
    const reachable = walk(starts.map((node) => node.key), outgoing, (edge) => edge.to);
    for (const node of diagram.nodes) {
      if (!reachable.has(node.key)) {
        context.addIssue({ code: 'custom', path: ['nodes'], message: `Node ${node.key} is not reachable from a start node` });
      }
    }
  }

  if (ends.length > 0) {
    const reachesEnd = walk(ends.map((node) => node.key), incoming, (edge) => edge.from);
    for (const node of diagram.nodes) {
      if (!reachesEnd.has(node.key)) {
        context.addIssue({ code: 'custom', path: ['nodes'], message: `Node ${node.key} cannot reach an end node` });
      }
    }
  }
});

function walk(
  initial: string[],
  adjacency: Map<string, Array<{ from: string; to: string }>>,
  next: (edge: { from: string; to: string }) => string,
) {
  const visited = new Set(initial);
  const queue = [...initial];
  while (queue.length > 0) {
    const key = queue.shift();
    if (!key) continue;
    for (const edge of adjacency.get(key) ?? []) {
      const target = next(edge);
      if (!visited.has(target)) {
        visited.add(target);
        queue.push(target);
      }
    }
  }
  return visited;
}

// Gemini structured output supports a focused JSON Schema subset. Keep all
// stronger length, pattern, reachability, and graph rules in aiDiagramSchema,
// which validates the untrusted response before it can reach the editor.
export const aiDiagramJsonSchema: Record<string, unknown> = {
  type: 'object',
  properties: {
    schemaVersion: {
      type: 'string',
      enum: ['1.0'],
      description: 'Canonical Wizzleflow AI diagram schema version.',
    },
    title: {
      type: 'string',
      description: 'A short descriptive title for the workflow.',
    },
    summary: {
      type: 'string',
      description: 'A concise summary of the workflow and its outcome.',
    },
    assumptions: {
      type: 'array',
      description: 'Plain-text assumptions made while converting the process into a diagram.',
      items: {
        type: 'string',
        description: 'One short assumption. Use an empty array when no assumptions are needed.',
      },
    },
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'A unique stable alphanumeric key beginning with a letter.',
          },
          kind: {
            type: 'string',
            enum: ['start', 'process', 'decision', 'inputOutput', 'end'],
          },
          label: {
            type: 'string',
            description: 'A short action-oriented label without markup.',
          },
          description: {
            type: 'string',
            description: 'A brief plain-text explanation; use an empty string when unnecessary.',
          },
        },
        required: ['key', 'kind', 'label', 'description'],
        additionalProperties: false,
      },
    },
    edges: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'A unique stable alphanumeric edge key beginning with a letter.',
          },
          from: {
            type: 'string',
            description: 'The key of an existing source node.',
          },
          to: {
            type: 'string',
            description: 'The key of an existing destination node.',
          },
          label: {
            type: 'string',
            description: 'A short branch label, or an empty string for a non-branching edge.',
          },
        },
        required: ['key', 'from', 'to', 'label'],
        additionalProperties: false,
      },
    },
  },
  required: ['schemaVersion', 'title', 'summary', 'assumptions', 'nodes', 'edges'],
  additionalProperties: false,
};

export type AiDiagram = z.infer<typeof aiDiagramSchema>;
export type AiDiagramNode = z.infer<typeof aiDiagramNodeSchema>;
export type AiDiagramEdge = z.infer<typeof aiDiagramEdgeSchema>;
