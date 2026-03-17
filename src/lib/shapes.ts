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

/** Ellipse cells using scanline — outline or filled */
export function ellipseCells(
  x0: number, y0: number,
  x1: number, y1: number,
  filled: boolean,
): [number, number][] {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const a  = (maxX - minX) / 2; // semi-axis x
  const b  = (maxY - minY) / 2; // semi-axis y

  if (a === 0 || b === 0) return bresenhamLine(x0, y0, x1, y1);

  const cells: [number, number][] = [];

  for (let iy = minY; iy <= maxY; iy++) {
    // Normalised vertical distance from centre
    const dy = (iy - cy) / b;
    const t  = 1 - dy * dy;
    if (t < 0) continue; // floating-point safety

    const dx = Math.sqrt(t) * a;
    const lx = Math.round(cx - dx);
    const rx = Math.round(cx + dx);

    if (filled) {
      for (let ix = lx; ix <= rx; ix++) cells.push([ix, iy]);
    } else {
      cells.push([lx, iy]);
      if (rx !== lx) cells.push([rx, iy]);
    }
  }

  return cells;
}
