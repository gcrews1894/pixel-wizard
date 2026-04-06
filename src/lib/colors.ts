export const SIMPLE_PALETTE: string[] = [
  // Blacks / greys / whites
  '#000000', '#1c1c1c', '#3c3c3c', '#5a5a5a',
  '#787878', '#969696', '#c0c0c0', '#ffffff',
  // Reds / pinks
  '#ff0000', '#cc0000', '#ff6666', '#ff99aa',
  // Oranges / yellows
  '#ff6600', '#ff9900', '#ffcc00', '#ffff00',
  // Greens
  '#006600', '#009900', '#33cc33', '#99ff66',
  // Cyans / blues
  '#00cccc', '#0099cc', '#0055ff', '#0033aa',
  // Purples / magentas
  '#cc00ff', '#9900cc', '#ff00ff', '#ff66cc',
  // Browns / skin tones
  '#5c2d00', '#8b4513', '#c68642', '#f4c89a',
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

export function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

/** H: 0-360, S: 0-100, B: 0-100 */
export function rgbToHsb(r: number, g: number, b: number): { h: number; s: number; bv: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : Math.round((delta / max) * 100);
  const bv = Math.round(max * 100);
  return { h, s, bv };
}

export function hsbToRgb(h: number, s: number, bv: number): { r: number; g: number; b: number } {
  const sv = s / 100, v = bv / 100;
  const c = v * sv;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let rn = 0, gn = 0, bn = 0;
  if (h < 60)       { rn = c; gn = x; }
  else if (h < 120) { rn = x; gn = c; }
  else if (h < 180) { gn = c; bn = x; }
  else if (h < 240) { gn = x; bn = c; }
  else if (h < 300) { rn = x; bn = c; }
  else              { rn = c; bn = x; }

  return {
    r: Math.round((rn + m) * 255),
    g: Math.round((gn + m) * 255),
    b: Math.round((bn + m) * 255),
  };
}
