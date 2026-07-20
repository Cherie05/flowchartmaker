import type { AiDiagram } from '../../../../shared/ai/aiDiagramSchema';
import type { Connection, FlowChartNode } from '../../../types/flowChart';
import { applyAiEditToDiagram } from './applyAiEdit';

const currentNodes: FlowChartNode[] = [
  { id: 'a', type: 'start', text: 'Start', width: 120, height: 60, position: { x: 0, y: 0 } },
  { id: 'b', type: 'process', text: 'Old step', width: 120, height: 60, position: { x: 0, y: 120 } },
  { id: 'c', type: 'end', text: 'End', width: 120, height: 60, position: { x: 0, y: 240 } },
];
const currentConnections: Connection[] = [
  { id: 'ab', from: 'a', to: 'b', fromSide: 'bottom', toSide: 'top' },
  { id: 'bc', from: 'b', to: 'c', fromSide: 'bottom', toSide: 'top' },
];

const fragment: AiDiagram = {
  schemaVersion: '1.0',
  title: 'Replacement',
  summary: 'A revised step.',
  assumptions: [],
  nodes: [
    { key: 'fStart', kind: 'start', label: 'Begin', description: '' },
    { key: 'fMid', kind: 'process', label: 'New step', description: '' },
    { key: 'fEnd', kind: 'end', label: 'Done', description: '' },
  ],
  edges: [
    { key: 'e1', from: 'fStart', to: 'fMid', label: '' },
    { key: 'e2', from: 'fMid', to: 'fEnd', label: '' },
  ],
};

describe('applyAiEditToDiagram', () => {
  it('removes the selected node and reconnects boundary edges to the fragment entry/exit', () => {
    const result = applyAiEditToDiagram(currentNodes, currentConnections, ['b'], fragment);

    expect(result.nodes.map((node) => node.id)).toEqual(['a', 'c', ...result.insertedNodeIds]);
    expect(result.insertedNodeIds).toHaveLength(3);

    const entryId = result.insertedNodeIds[0];
    const exitId = result.insertedNodeIds[2];
    const incoming = result.connections.find((connection) => connection.id === 'ab');
    const outgoing = result.connections.find((connection) => connection.id === 'bc');
    expect(incoming).toMatchObject({ from: 'a', to: entryId });
    expect(outgoing).toMatchObject({ from: exitId, to: 'c' });

    const internalConnections = result.connections.filter((connection) => connection.id !== 'ab' && connection.id !== 'bc');
    expect(internalConnections).toHaveLength(2);
  });

  it('leaves connections outside the selection untouched', () => {
    const extra: Connection = { id: 'loop', from: 'a', to: 'c', fromSide: 'right', toSide: 'right' };
    const result = applyAiEditToDiagram(currentNodes, [...currentConnections, extra], ['b'], fragment);
    expect(result.connections.find((connection) => connection.id === 'loop')).toEqual(extra);
  });
});
