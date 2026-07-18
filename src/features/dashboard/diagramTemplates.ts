import type { Connection, FlowChartDraft, FlowChartNode } from '../../types/flowChart';

export type StarterTemplateId = 'blank' | 'registration' | 'approval' | 'support';

export interface StarterTemplate {
  id: StarterTemplateId;
  name: string;
  description: string;
  nodes: FlowChartNode[];
  connections: Connection[];
}

export const starterTemplates: StarterTemplate[] = [
  { id: 'blank', name: 'Blank Flowchart', description: 'Start with a clean canvas.', nodes: [], connections: [] },
  {
    id: 'registration',
    name: 'User Registration Flow',
    description: 'A simple account-creation decision flow.',
    nodes: [
      node('registration-start', 'start', 120, 120, 'Registration starts', 132, 60),
      node('registration-details', 'process', 120, 240, 'Enter account details', 170, 80),
      node('registration-valid', 'decision', 140, 390, 'Details valid?', 140, 96),
      node('registration-retry', 'process', 380, 398, 'Show validation errors', 170, 80),
      node('registration-finish', 'end', 140, 550, 'Account created', 150, 60)
    ],
    connections: [
      connection('registration-c1', 'registration-start', 'registration-details'),
      connection('registration-c2', 'registration-details', 'registration-valid'),
      connection('registration-c3', 'registration-valid', 'registration-retry', 'right', 'left', 'No'),
      connection('registration-c4', 'registration-valid', 'registration-finish', 'bottom', 'top', 'Yes')
    ]
  },
  {
    id: 'approval',
    name: 'Approval Process',
    description: 'Review, approve, or return a request.',
    nodes: [
      node('approval-start', 'start', 120, 120, 'Request submitted', 140, 60),
      node('approval-review', 'process', 120, 250, 'Review request', 150, 80),
      node('approval-decision', 'decision', 135, 390, 'Approved?', 130, 92),
      node('approval-return', 'process', 370, 398, 'Return for changes', 160, 80),
      node('approval-end', 'end', 130, 540, 'Request approved', 150, 60)
    ],
    connections: [
      connection('approval-c1', 'approval-start', 'approval-review'),
      connection('approval-c2', 'approval-review', 'approval-decision'),
      connection('approval-c3', 'approval-decision', 'approval-return', 'right', 'left', 'No'),
      connection('approval-c4', 'approval-decision', 'approval-end', 'bottom', 'top', 'Yes')
    ]
  },
  {
    id: 'support',
    name: 'Customer Support Flow',
    description: 'Triage and resolve a support request.',
    nodes: [
      node('support-start', 'start', 120, 120, 'Request received', 140, 60),
      node('support-triage', 'process', 120, 245, 'Triage request', 150, 80),
      node('support-known', 'decision', 135, 385, 'Known solution?', 135, 92),
      node('support-escalate', 'process', 370, 392, 'Escalate to specialist', 170, 80),
      node('support-resolve', 'process', 135, 530, 'Apply solution', 140, 80),
      node('support-end', 'end', 135, 665, 'Request resolved', 145, 60)
    ],
    connections: [
      connection('support-c1', 'support-start', 'support-triage'),
      connection('support-c2', 'support-triage', 'support-known'),
      connection('support-c3', 'support-known', 'support-escalate', 'right', 'left', 'No'),
      connection('support-c4', 'support-known', 'support-resolve', 'bottom', 'top', 'Yes'),
      connection('support-c5', 'support-resolve', 'support-end')
    ]
  }
];

export function getStarterDiagramDraft(templateId: StarterTemplateId): FlowChartDraft {
  const template = starterTemplates.find((item) => item.id === templateId) ?? starterTemplates[0];
  return {
    name: template.id === 'blank' ? 'Untitled Diagram' : template.name,
    nodes: template.nodes.map((item) => ({ ...item, position: { ...item.position }, style: item.style ? { ...item.style } : undefined })),
    connections: template.connections.map((item) => ({ ...item, waypoints: item.waypoints?.map((point) => ({ ...point })) }))
  };
}

function node(id: string, type: FlowChartNode['type'], x: number, y: number, text: string, width: number, height: number): FlowChartNode {
  return { id, type, position: { x, y }, text, width, height };
}

function connection(id: string, from: string, to: string, fromSide: Connection['fromSide'] = 'bottom', toSide: Connection['toSide'] = 'top', label?: string): Connection {
  return { id, from, to, fromSide, toSide, type: 'curved', startMarker: 'none', endMarker: 'arrow', labelPosition: 0.5, ...(label ? { label } : {}) };
}
