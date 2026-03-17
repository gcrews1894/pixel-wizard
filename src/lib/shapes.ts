/** Bresenham's integer line algorithm */
export function bresenhamLine(
  x0: number, y0: number,
  x1: number, y1: number,
): [number, number][] {
  const cells: [number, number][] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0, y = y0;

  while (true) {
    cells.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 <  dx) { err += dx; y += sy; }
  }
  return cells;
}

/** Rectangle cells — outline or filled */
export function rectangleCells(
  x0: number, y0: number,
  x1: number, y1: number,
  filled: boolean,
): [number, number][] {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  const cells: [number, number][] = [];

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (filled || x === minX || x === maxX || y === minY || y === maxY) {
        cells.push([x, y]);
      }
    }
  }
  return cells;
}

/**
 * Ellipse cells using Zingl's midpoint algorithm for the outline, and a
 * scanline approach for filled. Zingl's algorithm steps pixel-by-pixel along
 * the perimeter so the outline is always connected with no gaps.
 *
 * Reference: Alois Zingl, "A Rasterizing Algorithm for Drawing Curves" (2012)
 */
export function ellipseCells(
  x0: number, y0: number,
  x1: number, y1: number,
  filled: boolean,
): [number, number][] {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  const aw = maxX - minX; // bounding-box width  (= 2a diameter)
  const bh = maxY - minY; // bounding-box height (= 2b diameter)

  if (aw === 0 || bh === 0) return bresenhamLine(x0, y0, x1, y1);

  /* ── Filled: scanline row-by-row ─────────────────────────────────────── */
  if (filled) {
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const a  = aw / 2;
    const b  = bh / 2;
    const cells: [number, number][] = [];
    for (let iy = minY; iy <= maxY; iy++) {
      const dy = (iy - cy) / b;
      const t  = 1 - dy * dy;
      if (t < 0) continue;
      const dx = Math.sqrt(t) * a;
      const lx = Math.round(cx - dx);
      const rx = Math.round(cx + dx);
      for (let ix = lx; ix <= rx; ix++) cells.push([ix, iy]);
    }
    return cells;
  }

  /* ── Outline: Zingl's midpoint ellipse algorithm ─────────────────────── */
  const seen  = new Set<number>();          // packed key: y*65536+x
  const cells: [number, number][] = [];

  function emit(x: number, y: number) {
    const key = y * 65536 + x;
    if (!seen.has(key)) { seen.add(key); cells.push([x, y]); }
  }

  // Work with mutable locals so the algorithm can modify them.
  let lx0 = minX, lx1 = maxX;
  let a  = aw;
  let b  = bh;
  const bOdd = b & 1;  // 1 when height is odd

  // Initial error terms (Zingl, integer form)
  let dx  = 4 * (1 - a) * b * b;
  let dy  = 4 * (bOdd + 1) * a * a;
  let err = dx + dy + bOdd * a * a;

  // Starting y positions: ly0 moves downward, ly1 moves upward
  let ly0 = minY + Math.floor((b + 1) / 2);
  let ly1 = ly0 - bOdd;

  // Scale error increments (a gets reused; save original b for the while guard)
  const bOrig = b;
  a  = 8 * a * a;
  const b1 = 8 * b * b;   // b itself is NOT changed — still equals bOrig

  // Phase 1: trace from the left/right extremes inward toward top/bottom
  do {
    emit(lx1, ly0); emit(lx0, ly0);
    emit(lx0, ly1); emit(lx1, ly1);
    const e2 = 2 * err;
    if (e2 <= dy) { ly0++; ly1--; err += dy += a; }
    if (e2 >= dx || 2 * err > dy) { lx0++; lx1--; err += dx += b1; }
  } while (lx0 <= lx1);

  // Phase 2: finish the top and bottom tips (needed for wide/flat ellipses)
  while (ly0 - ly1 <= bOrig) {
    emit(lx0 - 1, ly0); emit(lx1 + 1, ly0++);
    emit(lx0 - 1, ly1); emit(lx1 + 1, ly1--);
  }

  return cells;
}
