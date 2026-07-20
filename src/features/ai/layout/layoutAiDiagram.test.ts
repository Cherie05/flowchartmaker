import type { AiDiagram } from '../../../../shared/ai/aiDiagramSchema';
import { layoutAiDiagram } from './layoutAiDiagram';

function diagram(nodes: AiDiagram['nodes'], edges: AiDiagram['edges']): AiDiagram {
  return { schemaVersion: '1.0', title: 'Test', summary: 'Layout test', assumptions: [], nodes, edges };
}

const start = { key: 'start', kind: 'start' as const, label: 'Start', description: '' };
const end = { key: 'end', kind: 'end' as const, label: 'End', description: '' };

describe('layoutAiDiagram', () => {
  it('lays out a stable top-to-bottom linear process', () => {
    const input = diagram(
      [start, { key: 'step', kind: 'process', label: 'Step', description: '' }, end],
      [
        { key: 'a', from: 'start', to: 'step', label: '' },
        { key: 'b', from: 'step', to: 'end', label: '' },
      ],
    );
    const first = layoutAiDiagram(input);
    const second = layoutAiDiagram(input);
    expect([...first]).toEqual([...second]);
    expect(first.get('start')?.y).toBeLessThan(first.get('step')?.y ?? 0);
    expect(first.get('step')?.y).toBeLessThan(first.get('end')?.y ?? 0);
  });

  it.each([
    ['decision branches and merge', diagram(
      [start, { key: 'choice', kind: 'decision', label: 'Valid?', description: '' }, { key: 'yes', kind: 'process', label: 'Accept', description: '' }, { key: 'no', kind: 'process', label: 'Correct', description: '' }, { key: 'merge', kind: 'process', label: 'Notify', description: '' }, end],
      [{ key: 'a', from: 'start', to: 'choice', label: '' }, { key: 'b', from: 'choice', to: 'yes', label: 'Yes' }, { key: 'c', from: 'choice', to: 'no', label: 'No' }, { key: 'd', from: 'yes', to: 'merge', label: '' }, { key: 'e', from: 'no', to: 'merge', label: '' }, { key: 'f', from: 'merge', to: 'end', label: '' }],
    )],
    ['multiple decisions and end states', diagram(
      [start, { key: 'one', kind: 'decision', label: 'One?', description: '' }, { key: 'two', kind: 'decision', label: 'Two?', description: '' }, { key: 'endA', kind: 'end', label: 'A', description: '' }, { key: 'endB', kind: 'end', label: 'B', description: '' }, end],
      [{ key: 'a', from: 'start', to: 'one', label: '' }, { key: 'b', from: 'one', to: 'endA', label: 'No' }, { key: 'c', from: 'one', to: 'two', label: 'Yes' }, { key: 'd', from: 'two', to: 'endB', label: 'No' }, { key: 'e', from: 'two', to: 'end', label: 'Yes' }],
    )],
    ['small cycle with exit', diagram(
      [start, { key: 'work', kind: 'process', label: 'Work', description: '' }, { key: 'check', kind: 'decision', label: 'Done?', description: '' }, end],
      [{ key: 'a', from: 'start', to: 'work', label: '' }, { key: 'b', from: 'work', to: 'check', label: '' }, { key: 'c', from: 'check', to: 'work', label: 'No' }, { key: 'd', from: 'check', to: 'end', label: 'Yes' }],
    )],
  ])('avoids obvious overlap for %s', (_name, input) => {
    const positions = [...layoutAiDiagram(input).values()];
    for (let left = 0; left < positions.length; left += 1) {
      for (let right = left + 1; right < positions.length; right += 1) {
        const xSeparated = Math.abs(positions[left].x - positions[right].x) >= 180;
        const ySeparated = Math.abs(positions[left].y - positions[right].y) >= 120;
        expect(xSeparated || ySeparated).toBe(true);
      }
    }
  });
});

