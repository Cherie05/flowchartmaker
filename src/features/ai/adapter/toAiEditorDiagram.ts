import type { AiEditorDiagram } from '../../../../shared/ai/apiSchemas';
import type { Connection, FlowChartNode } from '../../../types/flowChart';

export function toAiEditorDiagram(title: string, nodes: FlowChartNode[], connections: Connection[]): AiEditorDiagram {
  return {
    title: title.trim() || 'Untitled diagram',
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type,
      text: node.text.trim() || node.type,
    })),
    connections: connections.map((connection) => ({
      id: connection.id,
      from: connection.from,
      to: connection.to,
      label: connection.label?.trim() || '',
    })),
  };
}
