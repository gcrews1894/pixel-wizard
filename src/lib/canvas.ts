export type Pixels = (string | null)[][];

import type { SelectionState } from '../store/canvasStore';

/** Draw a checkerboard pattern for transparent cells */
export function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const s = Math.max(2, Math.floor(w / 3));
  for (let cy = 0; cy < h; cy += s) {
    for (let cx = 0; cx < w; cx += s) {
      ctx.fillStyle =
        (Math.floor(cy / s) + Math.floor(cx / s)) % 2 === 0
          ? '#3a3a5c'
          : '#2a2a46';
      ctx.fillRect(x + cx, y + cy, Math.min(s, w - cx), Math.min(s, h - cy));
    }
  }
}

/** Render the pixel layer onto a canvas context */
export function renderPixels(
  ctx: CanvasRenderingContext2D,
  pixels: Pixels,
  gridW: number,
  gridH: number,
  canvasW: number,
  canvasH: number,
): void {
  const cellW = canvasW / gridW;
  const cellH = canvasH / gridH;
  ctx.clearRect(0, 0, canvasW, canvasH);

  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const col = pixels[y]?.[x];
      if (col) {
        ctx.fillStyle = col;
        ctx.fillRect(
          Math.round(x * cellW),
          Math.round(y * cellH),
          Math.ceil(cellW),
          Math.ceil(cellH),
        );
      } else {
        drawCheckerboard(
          ctx,
          Math.round(x * cellW),
          Math.round(y * cellH),
          Math.ceil(cellW),
          Math.ceil(cellH),
        );
      }
    }
  }
}

/** Render the grid overlay */
export function renderGrid(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  canvasW: number,
  canvasH: number,
): void {
  const cellW = canvasW / gridW;
  const cellH = canvasH / gridH;
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 0.5;

  for (let x = 0; x <= gridW; x++) {
    const px = Math.round(x * cellW);
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, canvasH);
    ctx.stroke();
  }
  for (let y = 0; y <= gridH; y++) {
    const py = Math.round(y * cellH);
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(canvasW, py);
    ctx.stroke();
  }
}

/** Flood fill in place */
export function floodFill(
  pixels: Pixels,
  x: number,
  y: number,
  gridW: number,
  gridH: number,
  targetColor: string | null,
  fillColor: string | null,
): void {
  if (fillColor === targetColor) return;
  const stack: [number, number][] = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cx >= gridW || cy < 0 || cy >= gridH) continue;
    if (pixels[cy][cx] !== targetColor) continue;
    pixels[cy][cx] = fillColor;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
}

export interface ExportOptions {
  scale: number;
  format: 'png' | 'jpeg' | 'webp';
  includeGrid: boolean;
  transparent: boolean;
}

/** Export to a data URL */
export function exportCanvas(
  pixels: Pixels,
  gridW: number,
  gridH: number,
  opts: ExportOptions,
): string {
  const { scale, format, includeGrid, transparent } = opts;
  const outW = gridW * scale;
  const outH = gridH * scale;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;

  // Background
  if (!transparent || format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);
  }

  // Pixels
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const col = pixels[y]?.[x];
      if (col) {
        ctx.fillStyle = col;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  // Grid overlay
  if (includeGrid && scale >= 2) {
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= gridW; x++) {
      ctx.beginPath();
      ctx.moveTo(x * scale, 0);
      ctx.lineTo(x * scale, outH);
      ctx.stroke();
    }
    for (let y = 0; y <= gridH; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * scale);
      ctx.lineTo(outW, y * scale);
      ctx.stroke();
    }
  }

  const mime =
    format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  return canvas.toDataURL(mime, 0.92);
}

/** Render selection overlay (dragging rect or floating pixels + border) onto the preview canvas */
export function renderSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  selection: SelectionState,
  gridW: number,
  gridH: number,
  canvasW: number,
  canvasH: number,
): void {
  const cellW = canvasW / gridW;
  const cellH = canvasH / gridH;
  ctx.clearRect(0, 0, canvasW, canvasH);

  let rectX: number, rectY: number, rectW: number, rectH: number;

  if (selection.phase === 'dragging') {
    const { startX, startY, endX, endY } = selection;
    rectX = Math.min(startX, endX);
    rectY = Math.min(startY, endY);
    rectW = Math.abs(endX - startX) + 1;
    rectH = Math.abs(endY - startY) + 1;
  } else {
    const { currentX, currentY, width, height, pixels: sp } = selection;
    rectX = currentX;
    rectY = currentY;
    rectW = width;
    rectH = height;
    // Draw floating pixels
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const col = sp[dy][dx];
        if (col) {
          ctx.fillStyle = col;
          ctx.fillRect(
            Math.round((currentX + dx) * cellW),
            Math.round((currentY + dy) * cellH),
            Math.ceil(cellW),
            Math.ceil(cellH),
          );
        }
      }
    }
  }

  // Dashed border — draw twice for contrast (white then black offset)
  const bx = Math.round(rectX * cellW);
  const by = Math.round(rectY * cellH);
  const bw = Math.round(rectW * cellW);
  const bh = Math.round(rectH * cellH);

  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);

  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineDashOffset = 0;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);

  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineDashOffset = 4;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);

  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
}
