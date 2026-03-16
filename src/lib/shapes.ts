/** Bresenham's integer line algorithm */
export function bresenhamLine(
  x0: number, y0: number,
  x1: number, y1: number,
): [number, number][] {
  const cells: [number, number][] = [];
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
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

/** Ellipse cells using midpoint algorithm — outline or scanline-filled */
export function ellipseCells(
  x0: number, y0: number,
  x1: number, y1: number,
  filled: boolean,
): [number, number][] {
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const a  = Math.abs(x1 - x0) / 2; // semi-axis x
  const b  = Math.abs(y1 - y0) / 2; // semi-axis y

  if (a === 0 || b === 0) {
    // degenerate — draw a line
    return bresenhamLine(x0, y0, x1, y1);
  }

  // Collect outline points per row using midpoint algorithm
  // Map: row y → [leftmost x, rightmost x]
  const rowMap = new Map<number, [number, number]>();

  function plot(px: number, py: number) {
    const ix = Math.round(px);
    const iy = Math.round(py);
    const existing = rowMap.get(iy);
    if (!existing) {
      rowMap.set(iy, [ix, ix]);
    } else {
      rowMap.set(iy, [Math.min(existing[0], ix), Math.max(existing[1], ix)]);
    }
  }

  // 4-quadrant symmetry
  function plotSym(dx: number, dy: number) {
    plot(cx + dx, cy + dy);
    plot(cx - dx, cy + dy);
    plot(cx + dx, cy - dy);
    plot(cx - dx, cy - dy);
  }

  // Region 1
  let x = 0;
  let y = b;
  let d1 = b * b - a * a * b + 0.25 * a * a;
  let dx = 2 * b * b * x;
  let dy = 2 * a * a * y;

  while (dx < dy) {
    plotSym(x, y);
    if (d1 < 0) {
      x++; dx += 2 * b * b; d1 += dx + b * b;
    } else {
      x++; y--; dx += 2 * b * b; dy -= 2 * a * a; d1 += dx - dy + b * b;
    }
  }

  // Region 2
  let d2 = b * b * (x + 0.5) * (x + 0.5) + a * a * (y - 1) * (y - 1) - a * a * b * b;
  while (y >= 0) {
    plotSym(x, y);
    if (d2 > 0) {
      y--; dy -= 2 * a * a; d2 += a * a - dy;
    } else {
      y--; x++; dx += 2 * b * b; dy -= 2 * a * a; d2 += dx - dy + a * a;
    }
  }

  const cells: [number, number][] = [];
  for (const [iy, [lx, rx]] of rowMap) {
    if (filled) {
      for (let ix = lx; ix <= rx; ix++) cells.push([ix, iy]);
    } else {
      cells.push([lx, iy]);
      if (rx !== lx) cells.push([rx, iy]);
    }
  }
  return cells;
}
