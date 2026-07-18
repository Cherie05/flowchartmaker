import type { Connection, FlowChartNode } from '../../../types/flowChart';

export const DIAGRAM_IMPORT_LIMITS = {
  maxFileSizeBytes: 1_000_000,
  maxNodes: 500,
  maxConnections: 1_000,
  maxTextLength: 2_000,
  maxNodeWidth: 2_400,
  maxNodeHeight: 1_600,
  minNodeDimension: 24,
  maxWaypoints: 20
} as const;

const nodeTypes = new Set<FlowChartNode['type']>([
  'start',
  'process',
  'decision',
  'end',
  'connector',
  'input',
  'manualInput',
  'manualOperation',
  'triangle',
  'hexagon',
  'database',
  'annotation'
]);
const nodeSides = new Set<Connection['fromSide']>(['top', 'right', 'bottom', 'left']);
const connectionTypes = new Set<NonNullable<Connection['type']>>(['curved', 'straight', 'elbow']);
const connectionMarkers = new Set<NonNullable<Connection['startMarker']>>(['none', 'arrow']);
const hexColorPattern = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;
const rgbColorPattern = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i;

export function validateImportFileSize(file: Pick<File, 'size'>): void {
  if (file.size > DIAGRAM_IMPORT_LIMITS.maxFileSizeBytes) {
    throw new Error(`Import files must be ${formatBytes(DIAGRAM_IMPORT_LIMITS.maxFileSizeBytes)} or smaller.`);
  }
}

export function validateImportedDiagram(value: unknown): void {
  if (!isRecord(value) || !Array.isArray(value.nodes)) {
    throw new Error('This file does not contain a valid flowchart with a nodes array.');
  }

  const connections = value.connections === undefined ? [] : value.connections;

  if (!Array.isArray(connections)) {
    throw new Error('The connections field must be an array when provided.');
  }

  if (value.nodes.length > DIAGRAM_IMPORT_LIMITS.maxNodes) {
    throw new Error(`A diagram can contain at most ${DIAGRAM_IMPORT_LIMITS.maxNodes} nodes.`);
  }

  if (connections.length > DIAGRAM_IMPORT_LIMITS.maxConnections) {
    throw new Error(`A diagram can contain at most ${DIAGRAM_IMPORT_LIMITS.maxConnections} connections.`);
  }

  const nodeIds = new Set<string>();
  value.nodes.forEach((node, index) => validateNode(node, index, nodeIds));

  const connectionIds = new Set<string>();
  connections.forEach((connection, index) => validateConnection(connection, index, nodeIds, connectionIds));
}

/** Returns a colour that is safe to place in an SVG attribute, or a safe fallback. */
export function safeSvgColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && isApprovedColor(value) ? value.trim() : fallback;
}

export function isApprovedColor(value: string): boolean {
  const color = value.trim();

  if (color === 'transparent' || hexColorPattern.test(color)) {
    return true;
  }

  const match = rgbColorPattern.exec(color);

  if (!match) {
    return false;
  }

  return [match[1], match[2], match[3]].every((component) => Number(component) <= 255);
}

function validateNode(value: unknown, index: number, nodeIds: Set<string>): void {
  const node = requireRecord(value, `Node ${index + 1}`);
  const id = readOptionalId(node.id, `Node ${index + 1}`);

  if (id) {
    if (nodeIds.has(id)) {
      throw new Error(`Node ${index + 1} has a duplicate id.`);
    }
    nodeIds.add(id);
  }

  if (node.type !== undefined && (!isString(node.type) || !nodeTypes.has(node.type as FlowChartNode['type']))) {
    throw new Error(`Node ${index + 1} has an unsupported type.`);
  }

  validateText(node.text, `Node ${index + 1} text`);
  validatePosition(node.position, `Node ${index + 1} position`);
  validateDimension(node.width, DIAGRAM_IMPORT_LIMITS.maxNodeWidth, `Node ${index + 1} width`);
  validateDimension(node.height, DIAGRAM_IMPORT_LIMITS.maxNodeHeight, `Node ${index + 1} height`);
  validateStyle(node.style, `Node ${index + 1} style`);
}

function validateConnection(value: unknown, index: number, nodeIds: Set<string>, connectionIds: Set<string>): void {
  const connection = requireRecord(value, `Connection ${index + 1}`);
  const id = readOptionalId(connection.id, `Connection ${index + 1}`);

  if (id) {
    if (connectionIds.has(id)) {
      throw new Error(`Connection ${index + 1} has a duplicate id.`);
    }
    connectionIds.add(id);
  }

  if (!isString(connection.from) || !nodeIds.has(connection.from) || !isString(connection.to) || !nodeIds.has(connection.to)) {
    throw new Error(`Connection ${index + 1} must reference existing node ids.`);
  }

  if (connection.fromSide !== undefined && (!isString(connection.fromSide) || !nodeSides.has(connection.fromSide as Connection['fromSide']))) {
    throw new Error(`Connection ${index + 1} has an invalid source side.`);
  }
  if (connection.toSide !== undefined && (!isString(connection.toSide) || !nodeSides.has(connection.toSide as Connection['toSide']))) {
    throw new Error(`Connection ${index + 1} has an invalid target side.`);
  }
  if (connection.type !== undefined && (!isString(connection.type) || !connectionTypes.has(connection.type as NonNullable<Connection['type']>))) {
    throw new Error(`Connection ${index + 1} has an unsupported type.`);
  }
  if (connection.startMarker !== undefined && (!isString(connection.startMarker) || !connectionMarkers.has(connection.startMarker as NonNullable<Connection['startMarker']>))) {
    throw new Error(`Connection ${index + 1} has an invalid start marker.`);
  }
  if (connection.endMarker !== undefined && (!isString(connection.endMarker) || !connectionMarkers.has(connection.endMarker as NonNullable<Connection['endMarker']>))) {
    throw new Error(`Connection ${index + 1} has an invalid end marker.`);
  }
  if (connection.color !== undefined && (!isString(connection.color) || !isApprovedColor(connection.color))) {
    throw new Error(`Connection ${index + 1} has an invalid colour.`);
  }

  validateText(connection.label, `Connection ${index + 1} label`);

  if (connection.labelPosition !== undefined && (!isFiniteNumber(connection.labelPosition) || connection.labelPosition < 0 || connection.labelPosition > 1)) {
    throw new Error(`Connection ${index + 1} label position must be between 0 and 1.`);
  }

  if (connection.waypoints !== undefined) {
    if (!Array.isArray(connection.waypoints) || connection.waypoints.length > DIAGRAM_IMPORT_LIMITS.maxWaypoints) {
      throw new Error(`Connection ${index + 1} can contain at most ${DIAGRAM_IMPORT_LIMITS.maxWaypoints} waypoints.`);
    }
    connection.waypoints.forEach((waypoint, waypointIndex) => validatePosition(waypoint, `Connection ${index + 1} waypoint ${waypointIndex + 1}`));
  }
}

function validateStyle(value: unknown, label: string): void {
  if (value === undefined) {
    return;
  }

  const style = requireRecord(value, label);
  for (const colorKey of ['backgroundColor', 'borderColor', 'color', 'textColor'] as const) {
    const color = style[colorKey];
    if (color !== undefined && (!isString(color) || !isApprovedColor(color))) {
      throw new Error(`${label} has an invalid ${colorKey} colour.`);
    }
  }
}

function validateText(value: unknown, label: string): void {
  if (value !== undefined && (!isString(value) || value.length > DIAGRAM_IMPORT_LIMITS.maxTextLength)) {
    throw new Error(`${label} must be a string no longer than ${DIAGRAM_IMPORT_LIMITS.maxTextLength} characters.`);
  }
}

function validatePosition(value: unknown, label: string): void {
  if (value === undefined) {
    return;
  }
  const position = requireRecord(value, label);
  if (!isFiniteNumber(position.x) || !isFiniteNumber(position.y)) {
    throw new Error(`${label} must contain finite x and y values.`);
  }
}

function validateDimension(value: unknown, maximum: number, label: string): void {
  if (value !== undefined && (!isFiniteNumber(value) || value < DIAGRAM_IMPORT_LIMITS.minNodeDimension || value > maximum)) {
    throw new Error(`${label} must be between ${DIAGRAM_IMPORT_LIMITS.minNodeDimension} and ${maximum}.`);
  }
}

function readOptionalId(value: unknown, label: string): string | null {
  if (value === undefined) {
    return null;
  }
  if (!isString(value) || !value.trim()) {
    throw new Error(`${label} id must be a non-empty string when provided.`);
  }
  return value.trim();
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${label} is invalid.`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function formatBytes(bytes: number): string {
  return `${Math.round(bytes / 1_000_000)} MB`;
}
