export interface Position {
  x: number;
  y: number;
}

export interface FlowChartNode {
  id: string;
  type: 'start' | 'process' | 'decision' | 'end' | 'connector';
  position: Position;
  text: string;
  width: number;
  height: number;
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
  };
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  fromSide: 'top' | 'right' | 'bottom' | 'left';
  toSide: 'top' | 'right' | 'bottom' | 'left';
  label?: string;
}

export interface FlowChart {
  id: string;
  name: string;
  nodes: FlowChartNode[];
  connections: Connection[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIFlowChartRequest {
  description: string;
  style?: 'simple' | 'detailed' | 'process' | 'decision-heavy';
}

export interface AIFlowChartResponse {
  nodes: Omit<FlowChartNode, 'id'>[];
  connections: Omit<Connection, 'id' | 'from' | 'to'>[];
  title: string;
  description: string;
}