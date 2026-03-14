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
