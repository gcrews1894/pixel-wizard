import type { Pixels } from '../lib/canvas';

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  gridW: number;
  gridH: number;
  pixels: Pixels;
  thumbnail: string; // base64 PNG data URL
}
