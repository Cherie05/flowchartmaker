import type { FlowChartNode, FlowChartNodeStyle } from '../../../types/flowChart';

export interface NodeDefaults {
  text: string;
  width: number;
  height: number;
  style?: FlowChartNodeStyle;
}

const NODE_DEFAULTS: Record<FlowChartNode['type'], NodeDefaults> = {
  start: { text: 'Start', width: 132, height: 60 },
  process: { text: 'Process Step', width: 140, height: 80 },
  decision: { text: 'Decision?', width: 120, height: 80 },
  end: { text: 'End', width: 132, height: 60 },
  connector: { text: 'Connector', width: 80, height: 60 },
  input: { text: 'Input / Output', width: 160, height: 80 },
  manualInput: { text: 'Manual Input', width: 150, height: 88 },
  manualOperation: { text: 'Manual Operation', width: 160, height: 80 },
  triangle: { text: 'Marker', width: 110, height: 96 },
  hexagon: { text: 'Preparation', width: 150, height: 80 },
  database: { text: 'Database', width: 150, height: 96 },
  annotation: { text: 'Annotation', width: 180, height: 92 }
};

export function getNodeDefaults(type: FlowChartNode['type']): NodeDefaults {
  const defaults = NODE_DEFAULTS[type];

  return {
    ...defaults,
    style: defaults.style ? { ...defaults.style } : undefined
  };
}
