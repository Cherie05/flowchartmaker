import type { Connection, FlowChartNode } from '../../../types/flowChart';
import { toAiEditorDiagram } from './toAiEditorDiagram';

const nodes: FlowChartNode[] = [
  { id: 'n1', type: 'start', text: 'Begin', width: 120, height: 60, position: { x: 0, y: 0 } },
  { id: 'n2', type: 'process', text: '  ', width: 120, height: 60, position: { x: 0, y: 120 } },
];
const connections: Connection[] = [
  { id: 'c1', from: 'n1', to: 'n2', fromSide: 'bottom', toSide: 'top', label: '  Continue  ' },
];

describe('toAiEditorDiagram', () => {
  it('maps node/connection fields and trims blank text', () => {
    const result = toAiEditorDiagram('My diagram', nodes, connections);
    expect(result.title).toBe('My diagram');
    expect(result.nodes).toEqual([
      { id: 'n1', type: 'start', text: 'Begin' },
      { id: 'n2', type: 'process', text: 'process' },
    ]);
    expect(result.connections).toEqual([{ id: 'c1', from: 'n1', to: 'n2', label: 'Continue' }]);
  });

  it('falls back to a default title when blank', () => {
    expect(toAiEditorDiagram('   ', [], []).title).toBe('Untitled diagram');
  });
});
