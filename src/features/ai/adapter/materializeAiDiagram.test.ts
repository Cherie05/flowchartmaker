import type { AiDiagram } from '../../../../shared/ai/aiDiagramSchema';
import { getAddToDiagramOrigin, materializeAiDiagram } from './materializeAiDiagram';
import { charsPerLineAt, estimateWrappedLines, fitFontSize, getInscribedTextBox } from '../../editor/domain/textFit';

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

  it('grows nodes so long generated labels stay inside the shape', () => {
    const longLabel: AiDiagram = {
      schemaVersion: '1.0',
      title: 'Refund',
      summary: 'Refund flow.',
      assumptions: [],
      nodes: [
        { key: 'start', kind: 'start', label: 'Start', description: '' },
        { key: 'notify', kind: 'process', label: 'Notify Customer: Refund Processed Successfully', description: '' },
        { key: 'end', kind: 'end', label: 'Done', description: '' },
      ],
      edges: [
        { key: 'a', from: 'start', to: 'notify', label: '' },
        { key: 'b', from: 'notify', to: 'end', label: '' },
      ],
    };

    const result = materializeAiDiagram(longLabel);
    const short = result.nodes.find((node) => node.text === 'Start');
    const long = result.nodes.find((node) => node.text.startsWith('Notify Customer'));

    expect(long!.width).toBeGreaterThan(short!.width);
    expect(long!.width).toBeLessThanOrEqual(240);
    // Must still fit the horizontal gap so siblings cannot collide.
    expect(long!.width).toBeLessThan(300);
  });

  // Reproduces the reported bug exactly: "Manager Approves?" and "Sufficient
  // Balance?" overflowed their diamonds because sizing used the node's full
  // bounding box, when a diamond's usable area is a much smaller inscribed
  // square. Confirms both that the node grows and that the label genuinely
  // fits the shape's inscribed area at the font size the renderer will pick.
  it.each([
    ['Manager Approves?'],
    ['Sufficient Balance?'],
    ['Is Eligible?'],
  ])('grows a decision diamond so "%s" fits inside it, not just its bounding box', (label) => {
    const diagram: AiDiagram = {
      schemaVersion: '1.0',
      title: 'Approval',
      summary: 'Approval flow.',
      assumptions: [],
      nodes: [
        { key: 'start', kind: 'start', label: 'Start', description: '' },
        { key: 'q', kind: 'decision', label, description: '' },
        { key: 'yes', kind: 'end', label: 'Yes', description: '' },
        { key: 'no', kind: 'end', label: 'No', description: '' },
      ],
      edges: [
        { key: 'a', from: 'start', to: 'q', label: '' },
        { key: 'b', from: 'q', to: 'yes', label: 'Yes' },
        { key: 'c', from: 'q', to: 'no', label: 'No' },
      ],
    };

    const result = materializeAiDiagram(diagram);
    const node = result.nodes.find((n) => n.text === label)!;

    // Grew past the 120x80 decision default.
    expect(node.width * node.height).toBeGreaterThan(120 * 80);

    // The label must fit the *inscribed* diamond, at whatever font size
    // Node.tsx would actually render (mirrors getResponsiveFontSize).
    const inscribed = getInscribedTextBox('decision', node.width, node.height);
    const base = Math.min(18, node.width / 8.4, node.height / 3.8);
    const fontSize = fitFontSize(label, inscribed.width, inscribed.height, { min: 9, max: Math.max(9, base) });
    const lines = estimateWrappedLines(label, charsPerLineAt(fontSize, inscribed.width));
    expect(lines * fontSize * 1.3).toBeLessThanOrEqual(inscribed.height - 16);
  });

  it('routes forward edges top-to-bottom and retry back-edges around the side', () => {
    const withRetry: AiDiagram = {
      schemaVersion: '1.0',
      title: 'Retry workflow',
      summary: 'Retries on failure.',
      assumptions: [],
      nodes: [
        { key: 'start', kind: 'start', label: 'Start', description: '' },
        { key: 'attempt', kind: 'process', label: 'Attempt', description: '' },
        { key: 'ok', kind: 'decision', label: 'Succeeded?', description: '' },
        { key: 'done', kind: 'end', label: 'Done', description: '' },
      ],
      edges: [
        { key: 'a', from: 'start', to: 'attempt', label: '' },
        { key: 'b', from: 'attempt', to: 'ok', label: '' },
        { key: 'c', from: 'ok', to: 'attempt', label: 'No' },
        { key: 'd', from: 'ok', to: 'done', label: 'Yes' },
      ],
    };

    const result = materializeAiDiagram(withRetry);
    const idByLabel = new Map(result.nodes.map((node) => [node.text, node.id]));
    const backEdge = result.connections.find(
      (connection) => connection.from === idByLabel.get('Succeeded?') && connection.to === idByLabel.get('Attempt'),
    );
    const forwardEdge = result.connections.find(
      (connection) => connection.from === idByLabel.get('Start') && connection.to === idByLabel.get('Attempt'),
    );

    expect(backEdge).toMatchObject({ fromSide: 'right', toSide: 'right', label: 'No' });
    expect(forwardEdge).toMatchObject({ fromSide: 'bottom', toSide: 'top' });
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
