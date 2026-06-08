export type NodeSide = 'top' | 'right' | 'bottom' | 'left';
export type FlowChartNodeType =
  | 'start'
  | 'process'
  | 'decision'
  | 'end'
  | 'connector'
  | 'input'
  | 'manualInput'
  | 'manualOperation'
  | 'triangle'
  | 'hexagon'
  | 'database'
  | 'annotation';
export type ConnectionType = 'curved' | 'straight' | 'elbow';
export type ConnectionMarker = 'none' | 'arrow';

export interface Position {
  x: number;
  y: number;
}

export interface FlowChartNodeStyle {
  backgroundColor?: string;
  borderColor?: string;
  color?: string;
  textColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'none';
  opacity?: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  rotation?: 0 | 90 | 180 | 270;
}

export interface FlowChartNode {
  id: string;
  type: FlowChartNodeType;
  position: Position;
  text: string;
  width: number;
  height: number;
  style?: FlowChartNodeStyle;
  groupId?: string;
  zIndex?: number;
  locked?: boolean;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  fromSide: NodeSide;
  toSide: NodeSide;
  label?: string;
  type?: ConnectionType;
  startMarker?: ConnectionMarker;
  endMarker?: ConnectionMarker;
  color?: string;
  labelPosition?: number;
  waypoints?: Position[];
  animated?: boolean;
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

export interface AIFlowChartConnection {
  fromIndex: number;
  toIndex: number;
  fromSide: NodeSide;
  toSide: NodeSide;
  label?: string;
}

export interface AIFlowChartResponse {
  nodes: Omit<FlowChartNode, 'id'>[];
  connections: AIFlowChartConnection[];
  title: string;
  description: string;
}

export interface FlowChartRecord {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  nodes: FlowChartNode[];
  connections: Connection[];
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

export interface FlowChartDraft {
  name?: string;
  nodes?: FlowChartNode[];
  connections?: Connection[];
}

export interface FlowChartUpdateInput extends FlowChartDraft {
  is_public?: boolean;
}
