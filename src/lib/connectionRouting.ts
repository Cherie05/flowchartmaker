import type { Connection, FlowChartNode, NodeSide, Position } from '../types/flowChart';

const OBSTACLE_PADDING = 28;
const PATH_MARGIN = 56;

export interface ConnectionGeometry {
  path: string;
  labelPoint: Position;
  bendHandlePoints?: Position[];
  bendHandlePoint?: Position; // legacy
  segments: Array<{
    start: Position;
    end: Position;
    length: number;
  }>;
}

export function getConnectionPoint(node: FlowChartNode, side: NodeSide): Position {
  switch (side) {
    case 'top':
      return { x: node.position.x + node.width / 2, y: node.position.y };
    case 'right':
      return { x: node.position.x + node.width, y: node.position.y + node.height / 2 };
    case 'bottom':
      return { x: node.position.x + node.width / 2, y: node.position.y + node.height };
    case 'left':
      return { x: node.position.x, y: node.position.y + node.height / 2 };
    default:
      return { x: node.position.x + node.width / 2, y: node.position.y + node.height };
  }
}

export function buildConnectionGeometry({
  connection,
  fromNode,
  toNode,
  obstacleNodes = []
}: {
  connection: Connection;
  fromNode: FlowChartNode;
  toNode: FlowChartNode;
  obstacleNodes?: FlowChartNode[];
}): ConnectionGeometry {
  const fromPoint = getConnectionPoint(fromNode, connection.fromSide);
  const toPoint = getConnectionPoint(toNode, connection.toSide);
  const connectionType = connection.type ?? 'curved';
  const labelPosition = connection.labelPosition ?? 0.5;

  if (connectionType === 'straight') {
    const pts = [fromPoint, ...(connection.waypoints || []), toPoint];
    const segments = buildLinearSegments(pts);
    return {
      path: buildPolylinePath(pts),
      segments,
      labelPoint: getPointAlongSegments(segments, labelPosition),
      bendHandlePoints: connection.waypoints
    };
  }

  if (connectionType === 'elbow') {
    if (connection.waypoints?.length) {
      let pts: Position[] = [fromPoint];
      const allPoints = [...connection.waypoints, toPoint];
      for (let i = 0; i < allPoints.length; i++) {
        const p1 = pts[pts.length - 1];
        const p2 = allPoints[i];
        const dx = Math.abs(p2.x - p1.x);
        const dy = Math.abs(p2.y - p1.y);
        if (dx > dy) {
           pts.push({ x: p2.x, y: p1.y });
        } else {
           pts.push({ x: p1.x, y: p2.y });
        }
        pts.push(p2);
      }
      pts = dedupePoints(pts);
      const segments = buildLinearSegments(pts);
      return {
        path: buildPolylinePath(pts),
        segments,
        labelPoint: getPointAlongSegments(segments, labelPosition),
        bendHandlePoints: connection.waypoints
      };
    }

    const waypoint =
      findSmartElbowWaypoint({
        fromPoint,
        toPoint,
        connection,
        obstacleNodes
      });
    const routePoints = buildElbowRoutePoints(fromPoint, toPoint, connection, waypoint);
    const segments = buildLinearSegments(routePoints);

    return {
      path: buildPolylinePath(routePoints),
      segments,
      labelPoint: getPointAlongSegments(segments, labelPosition),
      bendHandlePoint: waypoint
    };
  }

  const distance = Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y);
  const controlOffset = Math.min(distance / 3, 80);
  if (connection.waypoints?.length) {
    const pts = [fromPoint, ...connection.waypoints, toPoint];
    const segments = buildLinearSegments(pts);
    let path = `M ${pts[0].x} ${pts[0].y}`;
    if (pts.length === 3) {
      path += ` Q ${pts[1].x} ${pts[1].y} ${pts[2].x} ${pts[2].y}`;
    } else {
      path += ` L ${(pts[0].x + pts[1].x) / 2} ${(pts[0].y + pts[1].y) / 2}`;
      for (let i = 1; i < pts.length - 2; i++) {
        const curr = pts[i];
        const next = pts[i + 1];
        const mid = { x: (curr.x + next.x) / 2, y: (curr.y + next.y) / 2 };
        path += ` Q ${curr.x} ${curr.y} ${mid.x} ${mid.y}`;
      }
      const last = pts[pts.length - 2];
      const end = pts[pts.length - 1];
      path += ` Q ${last.x} ${last.y} ${end.x} ${end.y}`;
    }
    return {
      path,
      segments,
      labelPoint: getPointAlongSegments(segments, labelPosition),
      bendHandlePoints: connection.waypoints
    };
  }

  const { ctrl1, ctrl2 } = getCurvedControlPoints(fromPoint, toPoint, connection, controlOffset);

  return {
    path: `M ${fromPoint.x} ${fromPoint.y}
          C ${ctrl1.x} ${ctrl1.y}
            ${ctrl2.x} ${ctrl2.y}
            ${toPoint.x} ${toPoint.y}`,
    segments: buildLinearSegments([
      fromPoint,
      cubicBezierPoint(fromPoint, ctrl1, ctrl2, toPoint, 0.33),
      cubicBezierPoint(fromPoint, ctrl1, ctrl2, toPoint, 0.66),
      toPoint
    ]),
    labelPoint: cubicBezierPoint(fromPoint, ctrl1, ctrl2, toPoint, labelPosition),
    bendHandlePoint: cubicBezierPoint(fromPoint, ctrl1, ctrl2, toPoint, 0.5)
  };
}

export function getCurvedControlPoints(
  fromPoint: Position,
  toPoint: Position,
  connection: Connection,
  controlOffset: number
) {
  const fromVector = getSideVector(connection.fromSide);
  const toVector = getSideVector(connection.toSide);
  const bendOffset = Math.max(44, Math.min(120, controlOffset));
  const ctrl1 = {
    x: fromPoint.x + fromVector.x * bendOffset,
    y: fromPoint.y + fromVector.y * bendOffset
  };
  const ctrl2 = {
    x: toPoint.x + toVector.x * bendOffset,
    y: toPoint.y + toVector.y * bendOffset
  };

  if (
    Math.abs(fromPoint.y - toPoint.y) < 24 &&
    ((connection.fromSide === 'right' && connection.toSide === 'left') ||
      (connection.fromSide === 'left' && connection.toSide === 'right'))
  ) {
    const arch = fromPoint.x <= toPoint.x ? -bendOffset * 0.7 : bendOffset * 0.7;
    ctrl1.y += arch;
    ctrl2.y += arch;
  }

  if (
    Math.abs(fromPoint.x - toPoint.x) < 24 &&
    ((connection.fromSide === 'bottom' && connection.toSide === 'top') ||
      (connection.fromSide === 'top' && connection.toSide === 'bottom'))
  ) {
    const arch = fromPoint.y <= toPoint.y ? bendOffset * 0.7 : -bendOffset * 0.7;
    ctrl1.x += arch;
    ctrl2.x += arch;
  }

  return { ctrl1, ctrl2 };
}

export function cubicBezierPoint(
  start: Position,
  ctrl1: Position,
  ctrl2: Position,
  end: Position,
  t: number
) {
  const inverse = 1 - t;

  return {
    x:
      inverse ** 3 * start.x +
      3 * inverse ** 2 * t * ctrl1.x +
      3 * inverse * t ** 2 * ctrl2.x +
      t ** 3 * end.x,
    y:
      inverse ** 3 * start.y +
      3 * inverse ** 2 * t * ctrl1.y +
      3 * inverse * t ** 2 * ctrl2.y +
      t ** 3 * end.y
  };
}


function getSideVector(side: NodeSide) {
  switch (side) {
    case 'top':
      return { x: 0, y: -1 };
    case 'right':
      return { x: 1, y: 0 };
    case 'bottom':
      return { x: 0, y: 1 };
    case 'left':
      return { x: -1, y: 0 };
    default:
      return { x: 0, y: 1 };
  }
}

function buildElbowRoutePoints(
  fromPoint: Position,
  toPoint: Position,
  connection: Connection,
  waypoint: Position
): Position[] {
  const points: Position[] = [fromPoint];

  const firstBend =
    connection.fromSide === 'left' || connection.fromSide === 'right'
      ? { x: waypoint.x, y: fromPoint.y }
      : { x: fromPoint.x, y: waypoint.y };
  const secondBend =
    connection.toSide === 'left' || connection.toSide === 'right'
      ? { x: toPoint.x, y: waypoint.y }
      : { x: waypoint.x, y: toPoint.y };

  points.push(firstBend);
  points.push(waypoint);
  points.push(secondBend);
  points.push(toPoint);

  return dedupePoints(points);
}

function buildLinearSegments(points: Position[]) {
  const deduped = dedupePoints(points);

  return deduped.slice(0, -1).map((point, index) => ({
    start: point,
    end: deduped[index + 1],
    length: Math.hypot(deduped[index + 1].x - point.x, deduped[index + 1].y - point.y)
  }));
}

function dedupePoints(points: Position[]) {
  return points.filter((point, index) => {
    const previous = points[index - 1];
    return !previous || previous.x !== point.x || previous.y !== point.y;
  });
}

function buildPolylinePath(points: Position[]) {
  const [firstPoint, ...rest] = dedupePoints(points);

  if (!firstPoint) {
    return '';
  }

  return `M ${firstPoint.x} ${firstPoint.y} ${rest.map((point) => `L ${point.x} ${point.y}`).join(' ')}`;
}

function getPointAlongSegments(
  segments: Array<{
    start: Position;
    end: Position;
    length: number;
  }>,
  t: number
) {
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  const targetLength = totalLength * t;
  let traveled = 0;

  for (const segment of segments) {
    if (traveled + segment.length >= targetLength) {
      const localT = (targetLength - traveled) / Math.max(1, segment.length);
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * localT,
        y: segment.start.y + (segment.end.y - segment.start.y) * localT
      };
    }

    traveled += segment.length;
  }

  return segments[segments.length - 1]?.end ?? segments[0]?.start ?? { x: 0, y: 0 };
}

function findSmartElbowWaypoint({
  fromPoint,
  toPoint,
  connection,
  obstacleNodes
}: {
  fromPoint: Position;
  toPoint: Position;
  connection: Connection;
  obstacleNodes: FlowChartNode[];
}): Position {
  const midpoint = {
    x: (fromPoint.x + toPoint.x) / 2,
    y: (fromPoint.y + toPoint.y) / 2
  };
  const relevantObstacles = obstacleNodes
    .map((node) => ({
      x: node.position.x - OBSTACLE_PADDING,
      y: node.position.y - OBSTACLE_PADDING,
      width: node.width + OBSTACLE_PADDING * 2,
      height: node.height + OBSTACLE_PADDING * 2
    }))
    .filter((rect) =>
      rectsIntersect(
        {
          x: Math.min(fromPoint.x, toPoint.x) - PATH_MARGIN,
          y: Math.min(fromPoint.y, toPoint.y) - PATH_MARGIN,
          width: Math.abs(toPoint.x - fromPoint.x) + PATH_MARGIN * 2,
          height: Math.abs(toPoint.y - fromPoint.y) + PATH_MARGIN * 2
        },
        rect
      )
    );

  if (!relevantObstacles.length) {
    return midpoint;
  }

  const obstacleBounds = relevantObstacles.reduce(
    (bounds, rect) => ({
      minX: Math.min(bounds.minX, rect.x),
      minY: Math.min(bounds.minY, rect.y),
      maxX: Math.max(bounds.maxX, rect.x + rect.width),
      maxY: Math.max(bounds.maxY, rect.y + rect.height)
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY
    }
  );

  const candidates = dedupePoints([
    midpoint,
    { x: midpoint.x, y: obstacleBounds.minY - PATH_MARGIN },
    { x: midpoint.x, y: obstacleBounds.maxY + PATH_MARGIN },
    { x: obstacleBounds.minX - PATH_MARGIN, y: midpoint.y },
    { x: obstacleBounds.maxX + PATH_MARGIN, y: midpoint.y },
    { x: obstacleBounds.minX - PATH_MARGIN, y: obstacleBounds.minY - PATH_MARGIN },
    { x: obstacleBounds.minX - PATH_MARGIN, y: obstacleBounds.maxY + PATH_MARGIN },
    { x: obstacleBounds.maxX + PATH_MARGIN, y: obstacleBounds.minY - PATH_MARGIN },
    { x: obstacleBounds.maxX + PATH_MARGIN, y: obstacleBounds.maxY + PATH_MARGIN }
  ]).map((point) => ({
    x: Math.max(PATH_MARGIN, point.x),
    y: Math.max(PATH_MARGIN, point.y)
  }));

  let bestCandidate = midpoint;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const routePoints = buildElbowRoutePoints(fromPoint, toPoint, connection, candidate);
    const segments = buildLinearSegments(routePoints);
    const intersections = relevantObstacles.reduce((total, rect) => (
      total + segments.reduce((count, segment) => count + (segmentIntersectsRect(segment.start, segment.end, rect) ? 1 : 0), 0)
    ), 0);
    const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
    const score =
      intersections * 100000 +
      totalLength +
      Math.abs(candidate.x - midpoint.x) * 0.16 +
      Math.abs(candidate.y - midpoint.y) * 0.16;

    if (score < bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

function segmentIntersectsRect(start: Position, end: Position, rect: { x: number; y: number; width: number; height: number }) {
  const minX = rect.x;
  const maxX = rect.x + rect.width;
  const minY = rect.y;
  const maxY = rect.y + rect.height;

  if (start.x === end.x) {
    if (start.x < minX || start.x > maxX) {
      return false;
    }

    const segMinY = Math.min(start.y, end.y);
    const segMaxY = Math.max(start.y, end.y);
    return segMaxY >= minY && segMinY <= maxY;
  }

  if (start.y === end.y) {
    if (start.y < minY || start.y > maxY) {
      return false;
    }

    const segMinX = Math.min(start.x, end.x);
    const segMaxX = Math.max(start.x, end.x);
    return segMaxX >= minX && segMinX <= maxX;
  }

  return false;
}

function rectsIntersect(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number }
) {
  return !(
    left.x + left.width < right.x ||
    left.x > right.x + right.width ||
    left.y + left.height < right.y ||
    left.y > right.y + right.height
  );
}
