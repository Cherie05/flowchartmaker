import type { Connection, FlowChartNode, NodeSide } from '../types/flowChart';

const EXPORT_PADDING = 140;

export interface ExportSnapshot {
  width: number;
  height: number;
  svg: string;
}

export function buildFlowchartExport(nodes: FlowChartNode[], connections: Connection[]): ExportSnapshot {
  const bounds = getExportBounds(nodes);
  const width = Math.max(720, Math.round(bounds.maxX - bounds.minX + EXPORT_PADDING * 2));
  const height = Math.max(480, Math.round(bounds.maxY - bounds.minY + EXPORT_PADDING * 2));
  const offsetX = EXPORT_PADDING - bounds.minX;
  const offsetY = EXPORT_PADDING - bounds.minY;

  const defs = connections
    .map((connection) => {
      const markerId = `marker-${connection.id}`;
      const color = connection.color ?? '#64748b';

      return `
        <marker id="${markerId}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto-start-reverse" markerUnits="strokeWidth">
          <polygon points="0 0, 10 3.5, 0 7" fill="${color}" />
        </marker>
      `;
    })
    .join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <pattern id="export-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(148,163,184,0.14)" stroke-width="1" />
        </pattern>
        ${defs}
      </defs>
      <rect width="${width}" height="${height}" fill="#f8f4eb" />
      <rect width="${width}" height="${height}" fill="url(#export-grid)" />
      ${connections.map((connection) => renderConnection(connection, nodes, offsetX, offsetY)).join('')}
      ${nodes.map((node) => renderNode(node, offsetX, offsetY)).join('')}
    </svg>
  `.trim();

  return { width, height, svg };
}

export async function svgToPngDataUrl(svg: string, width: number, height: number): Promise<string> {
  const canvas = document.createElement('canvas');
  const scale = Math.min(2, window.devicePixelRatio || 1.5);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas export is not available in this browser.');
  }

  context.scale(scale, scale);

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(svgUrl);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function renderConnection(
  connection: Connection,
  nodes: FlowChartNode[],
  offsetX: number,
  offsetY: number
): string {
  const fromNode = nodes.find((node) => node.id === connection.from);
  const toNode = nodes.find((node) => node.id === connection.to);

  if (!fromNode || !toNode) {
    return '';
  }

  const fromPoint = getConnectionPoint(fromNode, connection.fromSide, offsetX, offsetY);
  const toPoint = getConnectionPoint(toNode, connection.toSide, offsetX, offsetY);
  const path = buildConnectionPath(fromPoint, toPoint, connection);
  const color = connection.color ?? '#64748b';
  const markerId = `marker-${connection.id}`;
  const midPoint = {
    x: (fromPoint.x + toPoint.x) / 2,
    y: (fromPoint.y + toPoint.y) / 2
  };
  const labelWidth = connection.label ? Math.max(58, connection.label.length * 6.5 + 24) : 0;

  return `
    <g>
      <path d="${path}" stroke="rgba(255,255,255,0.92)" stroke-width="5" fill="none" stroke-linecap="round" />
      <path
        d="${path}"
        stroke="${color}"
        stroke-width="2.25"
        fill="none"
        stroke-linecap="round"
        ${connection.startMarker === 'arrow' ? `marker-start="url(#${markerId})"` : ''}
        ${(connection.endMarker ?? 'arrow') === 'arrow' ? `marker-end="url(#${markerId})"` : ''}
      />
      ${
        connection.label
          ? `
            <rect
              x="${midPoint.x - labelWidth / 2}"
              y="${midPoint.y - 10}"
              width="${labelWidth}"
              height="20"
              rx="10"
              fill="#ffffff"
              stroke="rgba(148,163,184,0.35)"
            />
            <text x="${midPoint.x}" y="${midPoint.y + 3}" text-anchor="middle" font-size="12" font-weight="600" fill="#334155">
              ${escapeXml(connection.label)}
            </text>
          `
          : ''
      }
    </g>
  `;
}

function renderNode(node: FlowChartNode, offsetX: number, offsetY: number): string {
  const defaults = getNodeDefaults(node.type);
  const x = node.position.x + offsetX;
  const y = node.position.y + offsetY;
  const fill = node.style?.backgroundColor ?? defaults.fill;
  const stroke = node.style?.borderColor ?? defaults.stroke;
  const textColor = node.style?.textColor ?? defaults.text;
  const strokeDasharray = node.style?.borderStyle === 'dashed' ? '8 6' : undefined;
  const strokeOpacity = node.style?.borderStyle === 'none' ? '0' : '1';
  const opacity = node.style?.opacity ?? 1;
  const fontSize = node.style?.fontSize ?? 12;
  const fontWeight = node.style?.fontWeight ?? '600';
  const shape = renderShape(node, x, y, fill, stroke, strokeDasharray, strokeOpacity, opacity);
  const label = renderText(node, x, y, textColor, fontSize, fontWeight);

  return `<g>${shape}${label}</g>`;
}

function renderShape(
  node: FlowChartNode,
  x: number,
  y: number,
  fill: string,
  stroke: string,
  strokeDasharray: string | undefined,
  strokeOpacity: string,
  opacity: number
): string {
  const common = `fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-opacity="${strokeOpacity}" opacity="${opacity}"${
    strokeDasharray ? ` stroke-dasharray="${strokeDasharray}"` : ''
  }`;

  switch (node.type) {
    case 'start':
    case 'end':
    case 'connector':
      return `<ellipse cx="${x + node.width / 2}" cy="${y + node.height / 2}" rx="${node.width / 2}" ry="${node.height / 2}" ${common} />`;
    case 'decision':
      return `<polygon points="${x + node.width / 2},${y} ${x + node.width},${y + node.height / 2} ${x + node.width / 2},${y + node.height} ${x},${y + node.height / 2}" ${common} />`;
    case 'input':
      return `<polygon points="${x + node.width * 0.1},${y} ${x + node.width},${y} ${x + node.width * 0.9},${y + node.height} ${x},${y + node.height}" ${common} />`;
    case 'manualInput':
      return `<polygon points="${x},${y + node.height * 0.16} ${x + node.width},${y} ${x + node.width},${y + node.height} ${x},${y + node.height}" ${common} />`;
    case 'manualOperation':
      return `<polygon points="${x + node.width * 0.1},${y} ${x + node.width * 0.9},${y} ${x + node.width},${y + node.height} ${x},${y + node.height}" ${common} />`;
    case 'triangle':
      return `<polygon points="${x + node.width / 2},${y} ${x + node.width},${y + node.height} ${x},${y + node.height}" ${common} />`;
    case 'hexagon':
      return `<polygon points="${x + node.width * 0.14},${y} ${x + node.width * 0.86},${y} ${x + node.width},${y + node.height / 2} ${x + node.width * 0.86},${y + node.height} ${x + node.width * 0.14},${y + node.height} ${x},${y + node.height / 2}" ${common} />`;
    case 'database':
      return `
        <rect x="${x}" y="${y + 10}" width="${node.width}" height="${node.height - 20}" rx="26" ${common} />
        <ellipse cx="${x + node.width / 2}" cy="${y + 16}" rx="${node.width / 2}" ry="12" fill="rgba(255,255,255,0.34)" stroke="${stroke}" stroke-width="2" stroke-opacity="${strokeOpacity}" />
        <ellipse cx="${x + node.width / 2}" cy="${y + node.height - 16}" rx="${node.width / 2}" ry="12" fill="rgba(255,255,255,0.16)" stroke="${stroke}" stroke-width="2" stroke-opacity="${strokeOpacity}" />
      `;
    case 'annotation':
      return `
        <rect x="${x}" y="${y}" width="${node.width}" height="${node.height}" rx="18" ${common} />
        <rect x="${x + 14}" y="${y + 14}" width="4" height="${Math.max(28, node.height - 28)}" rx="2" fill="rgba(148,163,184,0.8)" />
      `;
    default:
      return `<rect x="${x}" y="${y}" width="${node.width}" height="${node.height}" rx="22" ${common} />`;
  }
}

function renderText(
  node: FlowChartNode,
  x: number,
  y: number,
  textColor: string,
  fontSize: number,
  fontWeight: string
): string {
  const centerX = x + node.width / 2;
  const centerY = y + node.height / 2;
  const maxWidth = Math.max(60, node.width - 20);
  const lines = wrapText(node.text, Math.floor(maxWidth / Math.max(6, fontSize * 0.55)));
  const startY = centerY - ((lines.length - 1) * (fontSize + 2)) / 2;

  return lines
    .map(
      (line, index) => `
        <text
          x="${centerX}"
          y="${startY + index * (fontSize + 2)}"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="${fontSize}"
          font-weight="${fontWeight}"
          fill="${textColor}"
        >
          ${escapeXml(line)}
        </text>
      `
    )
    .join('');
}

function getConnectionPoint(node: FlowChartNode, side: NodeSide, offsetX: number, offsetY: number) {
  const x = node.position.x + offsetX;
  const y = node.position.y + offsetY;

  switch (side) {
    case 'top':
      return { x: x + node.width / 2, y };
    case 'right':
      return { x: x + node.width, y: y + node.height / 2 };
    case 'bottom':
      return { x: x + node.width / 2, y: y + node.height };
    case 'left':
      return { x, y: y + node.height / 2 };
    default:
      return { x: x + node.width / 2, y: y + node.height };
  }
}

function buildConnectionPath(
  fromPoint: { x: number; y: number },
  toPoint: { x: number; y: number },
  connection: Connection
): string {
  const type = connection.type ?? 'curved';
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const controlOffset = Math.min(distance / 3, 80);

  if (type === 'straight') {
    return `M ${fromPoint.x} ${fromPoint.y} L ${toPoint.x} ${toPoint.y}`;
  }

  if (type === 'elbow') {
    if (connection.fromSide === 'left' || connection.fromSide === 'right') {
      const midX = fromPoint.x + (toPoint.x - fromPoint.x) / 2;
      return `M ${fromPoint.x} ${fromPoint.y} L ${midX} ${fromPoint.y} L ${midX} ${toPoint.y} L ${toPoint.x} ${toPoint.y}`;
    }

    const midY = fromPoint.y + (toPoint.y - fromPoint.y) / 2;
    return `M ${fromPoint.x} ${fromPoint.y} L ${fromPoint.x} ${midY} L ${toPoint.x} ${midY} L ${toPoint.x} ${toPoint.y}`;
  }

  if (connection.fromSide === 'bottom' && connection.toSide === 'top') {
    return `M ${fromPoint.x} ${fromPoint.y} C ${fromPoint.x} ${fromPoint.y + controlOffset} ${toPoint.x} ${toPoint.y - controlOffset} ${toPoint.x} ${toPoint.y}`;
  }

  if (connection.fromSide === 'right' && connection.toSide === 'left') {
    return `M ${fromPoint.x} ${fromPoint.y} C ${fromPoint.x + controlOffset} ${fromPoint.y} ${toPoint.x - controlOffset} ${toPoint.y} ${toPoint.x} ${toPoint.y}`;
  }

  if (connection.fromSide === 'left' && connection.toSide === 'right') {
    return `M ${fromPoint.x} ${fromPoint.y} C ${fromPoint.x - controlOffset} ${fromPoint.y} ${toPoint.x + controlOffset} ${toPoint.y} ${toPoint.x} ${toPoint.y}`;
  }

  const midX = (fromPoint.x + toPoint.x) / 2;
  const midY = (fromPoint.y + toPoint.y) / 2;
  return `M ${fromPoint.x} ${fromPoint.y} Q ${midX} ${midY} ${toPoint.x} ${toPoint.y}`;
}

function getExportBounds(nodes: FlowChartNode[]) {
  if (!nodes.length) {
    return { minX: 0, minY: 0, maxX: 640, maxY: 420 };
  }

  return nodes.reduce(
    (bounds, node) => ({
      minX: Math.min(bounds.minX, node.position.x),
      minY: Math.min(bounds.minY, node.position.y),
      maxX: Math.max(bounds.maxX, node.position.x + node.width),
      maxY: Math.max(bounds.maxY, node.position.y + node.height)
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: 0,
      maxY: 0
    }
  );
}

function getNodeDefaults(type: FlowChartNode['type']) {
  switch (type) {
    case 'start':
      return { fill: '#ecfdf5', stroke: '#a7f3d0', text: '#064e3b' };
    case 'end':
      return { fill: '#fff1f2', stroke: '#fecdd3', text: '#881337' };
    case 'decision':
      return { fill: '#fffbeb', stroke: '#fde68a', text: '#78350f' };
    case 'connector':
      return { fill: '#f5f3ff', stroke: '#ddd6fe', text: '#5b21b6' };
    case 'input':
      return { fill: '#f0f9ff', stroke: '#bae6fd', text: '#0c4a6e' };
    case 'manualInput':
      return { fill: '#fdf4ff', stroke: '#f5d0fe', text: '#86198f' };
    case 'manualOperation':
      return { fill: '#fff7ed', stroke: '#fed7aa', text: '#9a3412' };
    case 'triangle':
      return { fill: '#f8fafc', stroke: '#cbd5e1', text: '#0f172a' };
    case 'hexagon':
      return { fill: '#ecfeff', stroke: '#a5f3fc', text: '#164e63' };
    case 'database':
      return { fill: '#eef2ff', stroke: '#c7d2fe', text: '#312e81' };
    case 'annotation':
      return { fill: '#ffffff', stroke: '#cbd5e1', text: '#0f172a' };
    default:
      return { fill: '#ffffff', stroke: '#bae6fd', text: '#0f172a' };
  }
}

function wrapText(text: string, limit: number): string[] {
  const words = text.trim().split(/\s+/);

  if (!words.length || !words[0]) {
    return [''];
  }

  const lines: string[] = [];
  let currentLine = words[0];

  for (const word of words.slice(1)) {
    if (`${currentLine} ${word}`.length <= limit) {
      currentLine = `${currentLine} ${word}`;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  lines.push(currentLine);
  return lines.slice(0, 4);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load the export image.'));
    image.src = src;
  });
}
