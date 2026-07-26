const RESOURCE_CYCLE = ["desert", "wood", "brick", "sheep", "wheat", "ore"];
const NUMBER_CYCLE = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12];

const DEFAULT_RESOURCES = [
  "desert",
  "wood",
  "wood",
  "wood",
  "wood",
  "brick",
  "brick",
  "brick",
  "sheep",
  "sheep",
  "sheep",
  "sheep",
  "wheat",
  "wheat",
  "wheat",
  "wheat",
  "ore",
  "ore",
  "ore",
];

const DEFAULT_NUMBERS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

const HEX_SIZE = 46;

function axialToPixel(q, r) {
  const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
  const y = HEX_SIZE * 1.5 * r;
  return { x, y };
}

function hexCorners(cx, cy) {
  const corners = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    corners.push({
      x: cx + HEX_SIZE * Math.cos(angle),
      y: cy + HEX_SIZE * Math.sin(angle),
    });
  }
  return corners;
}

function pointKey(x, y) {
  return `${Math.round(x)}_${Math.round(y)}`;
}

export function generateBoard() {
  const axialCoords = [];
  for (let q = -2; q <= 2; q++) {
    for (let r = -2; r <= 2; r++) {
      if (q + r >= -2 && q + r <= 2) axialCoords.push({ q, r });
    }
  }
  // Reading order: row by row (r ascending), then q ascending, so the
  // default resource/number lists lay out roughly like a real board.
  axialCoords.sort((a, b) => (a.r === b.r ? a.q - b.q : a.r - b.r));

  const vertexMap = new Map();
  const edgeMap = new Map();
  let vertexId = 0;
  let edgeId = 0;
  let resourceCursor = 0;
  let numberCursor = 0;

  const tiles = axialCoords.map((coord, i) => {
    const { x: cx, y: cy } = axialToPixel(coord.q, coord.r);
    const corners = hexCorners(cx, cy);
    const cornerIds = corners.map((pt) => {
      const key = pointKey(pt.x, pt.y);
      if (!vertexMap.has(key)) {
        vertexMap.set(key, {
          id: `v${vertexId++}`,
          x: pt.x,
          y: pt.y,
          building: null,
        });
      }
      return vertexMap.get(key).id;
    });

    for (let i2 = 0; i2 < 6; i2++) {
      const a = cornerIds[i2];
      const b = cornerIds[(i2 + 1) % 6];
      const key = [a, b].sort().join("-");
      if (!edgeMap.has(key)) {
        const va = [...vertexMap.values()].find((v) => v.id === a);
        const vb = [...vertexMap.values()].find((v) => v.id === b);
        edgeMap.set(key, {
          id: `e${edgeId++}`,
          a,
          b,
          x1: va.x,
          y1: va.y,
          x2: vb.x,
          y2: vb.y,
          road: null,
          uses: 0,
        });
      }
      edgeMap.get(key).uses += 1;
    }

    const resource = DEFAULT_RESOURCES[resourceCursor++] ?? "wood";
    const number = resource === "desert" ? null : DEFAULT_NUMBERS[numberCursor++] ?? 6;

    return {
      id: `t${i}`,
      q: coord.q,
      r: coord.r,
      cx,
      cy,
      cornerIds,
      corners,
      resource,
      number,
    };
  });

  const vertices = [...vertexMap.values()];
  const edges = [...edgeMap.values()];

  const boundaryEdges = edges.filter((e) => e.uses === 1);
  const orderedBoundary = orderBoundaryEdges(boundaryEdges);

  const DEFAULT_PORTS = ["3:1", "wood", "3:1", "sheep", "wheat", "3:1", "ore", "brick", "3:1"];
  const PORT_OFFSET = 30;
  const NUM_PORTS = 9;

  // Ports are sampled at even steps around the coastline. Because the
  // ring's starting point is otherwise arbitrary, rotate it so index 0 is
  // the boundary edge closest to due north, then shift by
  // PORT_ROTATION_STEPS (each step ~= one boundary edge, ~12deg on this
  // board). Bump this constant (0..orderedBoundary.length-1) to rotate the
  // whole set of ports clockwise until they land where you want. A
  // negative-feeling rotation? Use orderedBoundary.length - N instead of
  // -N, since JS % doesn't wrap negatives the way you'd expect.
  const PORT_ROTATION_STEPS =4;

  const northIndex = orderedBoundary.reduce((bestIdx, edge, idx, arr) => {
    const best = arr[bestIdx];
    const bestAngle = Math.atan2((best.y1 + best.y2) / 2, (best.x1 + best.x2) / 2);
    const angle = Math.atan2((edge.y1 + edge.y2) / 2, (edge.x1 + edge.x2) / 2);
    // North is angle -90deg (-PI/2) in screen space (y grows downward).
    const dist = (a) => Math.abs(((a + Math.PI / 2 + Math.PI) % (2 * Math.PI)) - Math.PI);
    return dist(angle) < dist(bestAngle) ? idx : bestIdx;
  }, 0);

  const rotation = (northIndex + PORT_ROTATION_STEPS) % orderedBoundary.length;
  const rotatedBoundary = orderedBoundary
    .slice(rotation)
    .concat(orderedBoundary.slice(0, rotation));

  const ports = [];
  for (let i = 0; i < NUM_PORTS; i++) {
    const edge = rotatedBoundary[Math.floor((i * rotatedBoundary.length) / NUM_PORTS)];
    const midX = (edge.x1 + edge.x2) / 2;
    const midY = (edge.y1 + edge.y2) / 2;
    const len = Math.sqrt(midX * midX + midY * midY) || 1;
    const dirX = midX / len;
    const dirY = midY / len;
    ports.push({
      id: `port${ports.length}`,
      edgeId: edge.id,
      dockX: midX,
      dockY: midY,
      ex1: edge.x1,
      ey1: edge.y1,
      ex2: edge.x2,
      ey2: edge.y2,
      x: midX + dirX * PORT_OFFSET,
      y: midY + dirY * PORT_OFFSET,
      type: DEFAULT_PORTS[ports.length % DEFAULT_PORTS.length],
    });
  }

  const xs = vertices.map((v) => v.x);
  const ys = vertices.map((v) => v.y);
  const bounds = {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };

  return { tiles, vertices, edges, ports, bounds };
}

function orderBoundaryEdges(boundaryEdges) {
  const byVertex = new Map();
  boundaryEdges.forEach((e) => {
    [e.a, e.b].forEach((v) => {
      if (!byVertex.has(v)) byVertex.set(v, []);
      byVertex.get(v).push(e);
    });
  });

  const ordered = [];
  const visited = new Set();
  let current = boundaryEdges[0];
  let prevVertex = current?.a;

  while (current && !visited.has(current.id)) {
    ordered.push(current);
    visited.add(current.id);
    const nextVertex = current.a === prevVertex ? current.b : current.a;
    const candidates = (byVertex.get(nextVertex) || []).filter((e) => !visited.has(e.id));
    current = candidates[0];
    prevVertex = nextVertex;
  }

  return ordered;
}

export { RESOURCE_CYCLE, NUMBER_CYCLE };

export function pipsForNumber(n) {
  const table = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 };
  return table[n] ?? 0;
}
