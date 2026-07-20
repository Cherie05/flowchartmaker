import type { AiDiagram } from '../../../../shared/ai/aiDiagramSchema';
import { materializeAiDiagram } from '../adapter/materializeAiDiagram';

// The exact workflow from the reported screenshot, used to sanity-check the
// overall shape of a generated diagram rather than any single rule.
const refund: AiDiagram = {
  schemaVersion: '1.0',
  title: 'Online Refund Processing Workflow',
  summary: 'Refund requests are checked, approved, and the customer notified.',
  assumptions: [],
  nodes: [
    { key: 'received', kind: 'start', label: 'Refund Request Received', description: '' },
    { key: 'check', kind: 'process', label: 'Check Eligibility', description: '' },
    { key: 'eligible', kind: 'decision', label: 'Is Eligible?', description: '' },
    { key: 'ineligible', kind: 'end', label: 'Notify Customer: Ineligible', description: '' },
    { key: 'amount', kind: 'decision', label: 'Amount > 5,000?', description: '' },
    { key: 'requestApproval', kind: 'process', label: 'Request Manager Approval', description: '' },
    { key: 'approved', kind: 'decision', label: 'Manager Approved?', description: '' },
    { key: 'rejected', kind: 'end', label: 'Notify Customer: Refund Rejected', description: '' },
    { key: 'processRefund', kind: 'process', label: 'Process Refund', description: '' },
    { key: 'processed', kind: 'end', label: 'Notify Customer: Refund Processed', description: '' },
  ],
  edges: [
    { key: 'e1', from: 'received', to: 'check', label: '' },
    { key: 'e2', from: 'check', to: 'eligible', label: '' },
    { key: 'e3', from: 'eligible', to: 'ineligible', label: 'No' },
    { key: 'e4', from: 'eligible', to: 'amount', label: 'Yes' },
    { key: 'e5', from: 'amount', to: 'requestApproval', label: 'Yes' },
    { key: 'e6', from: 'amount', to: 'processRefund', label: 'No' },
    { key: 'e7', from: 'requestApproval', to: 'approved', label: '' },
    { key: 'e8', from: 'approved', to: 'rejected', label: 'Rejected' },
    { key: 'e9', from: 'approved', to: 'processRefund', label: 'Approved' },
    { key: 'e10', from: 'processRefund', to: 'processed', label: '' },
  ],
};

describe('generated refund workflow shape', () => {
  it('stays compact and keeps every node inside its own box', () => {
    const { nodes, connections } = materializeAiDiagram(refund);

    const minY = Math.min(...nodes.map((node) => node.position.y));
    const maxY = Math.max(...nodes.map((node) => node.position.y + node.height));
    const minX = Math.min(...nodes.map((node) => node.position.x));
    const maxX = Math.max(...nodes.map((node) => node.position.x + node.width));

    // Eight layers deep. Before the layout fixes this workflow also dragged
    // every terminal state to a shared bottom layer, which stretched it well
    // past this and forced long edges back across the canvas.
    expect(maxY - minY).toBeLessThanOrEqual(1200);
    expect(maxX - minX).toBeLessThanOrEqual(1100);

    // No node box may overlap another.
    for (let a = 0; a < nodes.length; a += 1) {
      for (let b = a + 1; b < nodes.length; b += 1) {
        const left = nodes[a];
        const right = nodes[b];
        const overlaps =
          left.position.x < right.position.x + right.width &&
          left.position.x + left.width > right.position.x &&
          left.position.y < right.position.y + right.height &&
          left.position.y + left.height > right.position.y;
        expect(overlaps).toBe(false);
      }
    }

    // Every forward edge should flow downward; only true back-edges route sideways.
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    for (const connection of connections) {
      const from = nodeById.get(connection.from)!;
      const to = nodeById.get(connection.to)!;
      if (connection.fromSide === 'bottom') {
        expect(to.position.y).toBeGreaterThan(from.position.y);
      }
    }
  });
});
