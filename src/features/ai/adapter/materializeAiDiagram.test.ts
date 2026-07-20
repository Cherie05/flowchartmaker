import type { AiDiagram } from '../../../../shared/ai/aiDiagramSchema';
import { getAddToDiagramOrigin, materializeAiDiagram } from './materializeAiDiagram';

const input: AiDiagram = {
  schemaVersion: '1.0',
  title: 'Input workflow',
  summary: 'Collect information.',
  assumptions: [],
  nodes: [
    { key: 'start', kind: 'start', label: 'Begin', description: '' },
    { key: 'input', kind: 'inputOutput', label: 'Enter details', description: '' },
    { key: 'end', kind: 'end', label: 'Complete', description: '' },
  ],
  edges: [
    { key: 'a', from: 'start', to: 'input', label: 'Continue' },
    { key: 'b', from: 'input', to: 'end', label: '' },
  ],
};

describe('materializeAiDiagram', () => {
  it('creates fresh editable IDs and correctly maps nodes and edge labels', () => {
    const first = materializeAiDiagram(input);
    const second = materializeAiDiagram(input);
    expect(first.nodes.map((node) => node.id)).not.toEqual(second.nodes.map((node) => node.id));
    expect(first.connections.map((edge) => edge.id)).not.toEqual(second.connections.map((edge) => edge.id));
    expect(first.nodes.find((node) => node.text === 'Enter details')?.type).toBe('input');
    expect(first.connections[0].label).toBe('Continue');
    expect(first.connections[0].from).toBe(first.nodes[0].id);
    expect(first.connections[0].to).toBe(first.nodes[1].id);
  });

  it('does not mutate canonical input and offsets additions beyond existing content', () => {
    const snapshot = structuredClone(input);
    materializeAiDiagram(input);
    expect(input).toEqual(snapshot);
    expect(getAddToDiagramOrigin([{ id: 'n', type: 'process', text: 'Existing', width: 140, height: 80, position: { x: 900, y: 220 } }])).toEqual({
      originX: 1420,
      originY: 220,
    });
  });
});
