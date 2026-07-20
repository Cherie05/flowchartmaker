import { aiDiagramJsonSchema, aiDiagramSchema, type AiDiagram } from './aiDiagramSchema';

export function validAiDiagram(): AiDiagram {
  return {
    schemaVersion: '1.0',
    title: 'Approval workflow',
    summary: 'A request is reviewed and either approved or rejected.',
    nodes: [
      { key: 'start', kind: 'start', label: 'Request submitted', description: '' },
      { key: 'review', kind: 'decision', label: 'Approved?', description: 'Review the request' },
      { key: 'approved', kind: 'end', label: 'Request approved', description: '' },
      { key: 'rejected', kind: 'end', label: 'Request rejected', description: '' },
    ],
    edges: [
      { key: 'start-review', from: 'start', to: 'review', label: '' },
      { key: 'review-approved', from: 'review', to: 'approved', label: 'Yes' },
      { key: 'review-rejected', from: 'review', to: 'rejected', label: 'No' },
    ],
  };
}

describe('aiDiagramSchema', () => {
  it('accepts a valid flowchart', () => {
    expect(aiDiagramSchema.parse(validAiDiagram()).title).toBe('Approval workflow');
  });

  it('uses a Gemini-compatible provider schema while retaining strict runtime validation', () => {
    const serialized = JSON.stringify(aiDiagramJsonSchema);
    expect(serialized).not.toContain('"$schema"');
    expect(serialized).not.toContain('"const"');
    expect(serialized).not.toContain('"pattern"');
    expect(serialized).not.toContain('"minLength"');
    expect(serialized).not.toContain('"maxLength"');
    expect(serialized).not.toContain('"minItems"');
    expect(serialized).not.toContain('"maxItems"');
  });

  it.each([
    ['duplicate node keys', (value: AiDiagram) => value.nodes.push({ ...value.nodes[0] })],
    ['duplicate edge keys', (value: AiDiagram) => value.edges.push({ ...value.edges[0], from: 'start', to: 'approved' })],
    ['missing start', (value: AiDiagram) => { value.nodes[0].kind = 'process'; }],
    ['missing end', (value: AiDiagram) => { value.nodes.filter((node) => node.kind === 'end').forEach((node) => { node.kind = 'process'; }); }],
    ['dangling edge', (value: AiDiagram) => { value.edges[0].to = 'unknown'; }],
    ['self edge', (value: AiDiagram) => { value.edges[0].to = 'start'; }],
    ['isolated node', (value: AiDiagram) => value.nodes.push({ key: 'isolated', kind: 'process', label: 'Unused', description: '' })],
    ['HTML content', (value: AiDiagram) => { value.nodes[0].label = '<b>Start</b>'; }],
    ['invalid decision branches', (value: AiDiagram) => { value.edges[1].label = ''; }],
  ])('rejects %s', (_name, mutate) => {
    const value = structuredClone(validAiDiagram());
    mutate(value);
    expect(aiDiagramSchema.safeParse(value).success).toBe(false);
  });

  it('rejects unsupported node kinds and oversized diagrams', () => {
    const unsupported = structuredClone(validAiDiagram()) as unknown as Record<string, unknown>;
    (unsupported.nodes as Array<Record<string, unknown>>)[0].kind = 'custom';
    expect(aiDiagramSchema.safeParse(unsupported).success).toBe(false);

    const oversized = structuredClone(validAiDiagram());
    for (let index = 0; index < 23; index += 1) {
      oversized.nodes.push({ key: `extra${index}`, kind: 'process', label: `Extra ${index}`, description: '' });
    }
    expect(aiDiagramSchema.safeParse(oversized).success).toBe(false);
  });
});
